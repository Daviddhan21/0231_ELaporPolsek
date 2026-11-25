import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { calculateDistanceMeters, checkOutOfJurisdiction } from '../utils/geoUtils.js';
import dotenv from 'dotenv';
dotenv.config();

const formatReportPrivacy = (row, requester) => {
  const isOfficer = requester?.role === 'OFFICER';
  const isOwner = requester?.user_id === row.user_id;
  const maskedName = `Pelapor #${row.user_id.slice(-4).toUpperCase()}`;

  return {
    ...row,
    is_anonymous: Boolean(row.is_anonymous),
    out_of_jurisdiction: Boolean(row.out_of_jurisdiction),
    reporter_name: (row.is_anonymous && !isOfficer && !isOwner) ? maskedName : row.reporter_name,
    reporter_nik: (isOfficer || isOwner) ? row.reporter_nik : null
  };
};

export const getActiveMapReports = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, c.category_name, c.icon_code, u.full_name AS reporter_name, u.nik AS reporter_nik
       FROM reports r
       JOIN categories c ON r.category_id = c.category_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.status IN ('PENDING', 'IN_PROGRESS')
       ORDER BY FIELD(r.priority_level, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC`
    );
    return res.json({ success: true, data: rows.map((r) => formatReportPrivacy(r, req.user)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { search, category_id, status, mine } = req.query;
    let sql = `
      SELECT r.*, c.category_name, c.icon_code, u.full_name AS reporter_name, u.nik AS reporter_nik
      FROM reports r
      JOIN categories c ON r.category_id = c.category_id
      JOIN users u ON r.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (mine === 'true' && req.user) {
      sql += ' AND r.user_id = ?';
      params.push(req.user.user_id);
    }
    if (category_id) {
      sql += ' AND r.category_id = ?';
      params.push(Number(category_id));
    }
    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (r.title LIKE ? OR r.incident_location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY FIELD(r.priority_level, 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'), r.created_at DESC`;
    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, data: rows.map((r) => formatReportPrivacy(r, req.user)) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getReportDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT r.*, c.category_name, c.icon_code, u.full_name AS reporter_name, u.nik AS reporter_nik
       FROM reports r
       JOIN categories c ON r.category_id = c.category_id
       JOIN users u ON r.user_id = u.user_id
       WHERE r.report_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    }

    const [responses] = await pool.query(
      `SELECT rr.*, u.full_name AS officer_name, u.badge_number, u.unit_name
       FROM report_responses rr
       JOIN users u ON rr.officer_id = u.user_id
       WHERE rr.report_id = ?
       ORDER BY rr.created_at ASC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        ...formatReportPrivacy(rows[0], req.user),
        timeline: responses
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createReport = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      category_id, title, description, priority_level = 'MEDIUM',
      incident_location, latitude, longitude,
      is_anonymous = 'false', force_submit = 'false'
    } = req.body;

    if (!category_id || !title || !description || !incident_location || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'Data laporan tidak lengkap.' });
    }

    const maxPending = Number(process.env.MAX_PENDING_REPORTS || 3);
    const [pendingRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM reports WHERE user_id = ? AND status = "PENDING"',
      [userId]
    );
    if (pendingRows[0].total >= maxPending) {
      return res.status(429).json({
        success: false,
        message: `Batas maksimal ${maxPending} laporan PENDING tercapai.`
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (String(force_submit) !== 'true') {
      const dupRadius = Number(process.env.DUPLICATE_RADIUS_METERS || 150);
      const dupHours = Number(process.env.DUPLICATE_WINDOW_HOURS || 2);

      const [recentReports] = await pool.query(
        `SELECT report_id, title, latitude, longitude, status, created_at
         FROM reports
         WHERE category_id = ? AND status IN ('PENDING', 'IN_PROGRESS')
           AND created_at >= NOW() - INTERVAL ? HOUR`,
        [Number(category_id), dupHours]
      );

      const duplicate = recentReports.find(
        (r) => calculateDistanceMeters(lat, lng, r.latitude, r.longitude) <= dupRadius
      );

      if (duplicate) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_DETECTED',
          message: 'Terdeteksi laporan serupa dalam radius < 150 meter dan < 2 jam terakhir.',
          existing_report: duplicate
        });
      }
    }

    const isOutOfJurisdiction = checkOutOfJurisdiction(lat, lng);
    const reportId = uuidv4();
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const anonBool = String(is_anonymous) === 'true' ? 1 : 0;

    await pool.query(
      `INSERT INTO reports
       (report_id, user_id, category_id, title, description, priority_level, incident_location, latitude, longitude, image_url, status, is_anonymous, out_of_jurisdiction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)`,
      [reportId, userId, Number(category_id), title, description, priority_level, incident_location, lat, lng, imageUrl, anonBool, isOutOfJurisdiction ? 1 : 0]
    );

    return res.status(201).json({
      success: true,
      message: isOutOfJurisdiction
        ? 'Laporan terkirim dengan penanda OUT_OF_JURISDICTION (Luar wilayah Polsek Prambanan).'
        : 'Laporan berhasil dikirim ke SPKT Polsek Prambanan.',
      data: { report_id: reportId, status: 'PENDING', out_of_jurisdiction: isOutOfJurisdiction, image_url: imageUrl }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const [rows] = await pool.query('SELECT * FROM reports WHERE report_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    const report = rows[0];
    if (report.user_id !== userId) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    if (report.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Laporan sudah diproses, tidak dapat diedit.' });

    const { category_id, title, description, priority_level, incident_location } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : report.image_url;

    await pool.query(
      `UPDATE reports SET category_id = ?, title = ?, description = ?, priority_level = ?, incident_location = ?, image_url = ? WHERE report_id = ?`,
      [
        category_id ? Number(category_id) : report.category_id,
        title || report.title,
        description || report.description,
        priority_level || report.priority_level,
        incident_location || report.incident_location,
        imageUrl,
        id
      ]
    );
    return res.json({ success: true, message: 'Laporan berhasil diperbarui.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    const [rows] = await pool.query('SELECT * FROM reports WHERE report_id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    const report = rows[0];
    if (report.user_id !== userId) return res.status(403).json({ success: false, message: 'Akses ditolak.' });
    if (report.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Laporan sudah diproses, tidak dapat dihapus.' });

    await pool.query('DELETE FROM reports WHERE report_id = ?', [id]);
    return res.json({ success: true, message: 'Laporan berhasil dihapus permanen.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

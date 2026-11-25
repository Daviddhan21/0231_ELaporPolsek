import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';

export const respondToReport = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { id } = req.params;
    const officerId = req.user.user_id;
    const { action_taken, response_notes = '', updated_status } = req.body;

    const validStatuses = ['IN_PROGRESS', 'SOLVED', 'TRANSFERRED', 'REJECTED'];
    if (!action_taken || !updated_status || !validStatuses.includes(updated_status)) {
      return res.status(400).json({
        success: false,
        message: 'Tindakan kepolisian dan status baru (IN_PROGRESS/SOLVED/TRANSFERRED/REJECTED) wajib diisi.'
      });
    }

    const [reports] = await conn.query('SELECT * FROM reports WHERE report_id = ?', [id]);
    if (reports.length === 0) {
      return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });
    }

    await conn.beginTransaction();

    const responseId = uuidv4();
    const proofImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    await conn.query(
      `INSERT INTO report_responses
       (response_id, report_id, officer_id, action_taken, response_notes, proof_image_url, updated_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [responseId, id, officerId, action_taken, response_notes, proofImageUrl, updated_status]
    );

    await conn.query('UPDATE reports SET status = ? WHERE report_id = ?', [updated_status, id]);
    await conn.commit();

    return res.status(201).json({
      success: true,
      message: `Tanggapan petugas disimpan. Status laporan diperbarui menjadi ${updated_status}.`,
      data: { response_id: responseId, report_id: id, updated_status, proof_image_url: proofImageUrl }
    });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

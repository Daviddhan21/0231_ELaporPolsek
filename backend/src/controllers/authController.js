import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const generateTokens = (user) => {
  const payload = {
    user_id: user.user_id,
    role: user.role,
    full_name: user.full_name,
    badge_number: user.badge_number,
    unit_name: user.unit_name
  };
  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '1d'
  });
  const refreshToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d'
  });
  return { accessToken, refreshToken };
};

export const registerCitizen = async (req, res) => {
  try {
    const { nik, full_name, email, phone_number, password } = req.body;
    if (!nik || !/^\d{16}$/.test(nik)) {
      return res.status(400).json({ success: false, message: 'NIK wajib berisi 16 digit angka.' });
    }
    if (!full_name || !email || !phone_number || !password) {
      return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi.' });
    }
    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ? OR nik = ?', [email, nik]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email atau NIK sudah terdaftar.' });
    }
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (user_id, nik, full_name, email, password_hash, phone_number, role)
       VALUES (?, ?, ?, ?, ?, ?, 'PELAPOR')`,
      [userId, nik, full_name, email, passwordHash, phone_number]
    );
    const newUser = { user_id: userId, role: 'PELAPOR', full_name, badge_number: null, unit_name: null };
    return res.status(201).json({
      success: true,
      message: 'Registrasi warga berhasil.',
      data: { user: { ...newUser, email, nik, phone_number }, ...generateTokens(newUser) }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password, login_as } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/NRP dan password wajib diisi.' });
    }
    const query = login_as === 'OFFICER'
      ? 'SELECT * FROM users WHERE badge_number = ? AND role = "OFFICER"'
      : 'SELECT * FROM users WHERE (email = ? OR badge_number = ?)';
    const params = login_as === 'OFFICER' ? [identifier] : [identifier, identifier];
    const [rows] = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Kredensial tidak ditemukan.' });
    }
    const user = rows[0];
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }
    return res.json({
      success: true,
      message: `Login berhasil sebagai ${user.role}.`,
      data: {
        user: {
          user_id: user.user_id,
          nik: user.nik,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role: user.role,
          badge_number: user.badge_number,
          unit_name: user.unit_name
        },
        ...generateTokens(user)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'Refresh token wajib disertakan.' });
    }
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [decoded.user_id]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.json({ success: true, data: generateTokens(rows[0]) });
  } catch {
    return res.status(401).json({ success: false, message: 'Refresh token tidak valid.' });
  }
};

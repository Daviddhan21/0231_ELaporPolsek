import pool from '../config/db.js';
export const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY category_id ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

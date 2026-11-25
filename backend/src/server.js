import dotenv from 'dotenv';
import app from './app.js';
import pool from './config/db.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Koneksi MySQL elapor_prambanan terhubung.');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server E-Lapor Polsek Prambanan aktif di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Gagal terhubung ke MySQL:', err.message);
    process.exit(1);
  }
}

startServer();

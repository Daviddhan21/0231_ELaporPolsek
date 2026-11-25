import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runSeeder() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    multipleStatements: true
  });

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await conn.query(schemaSql);
  await conn.query(`USE \`${process.env.DB_NAME}\``);

  const categories = [
    ['Kriminalitas / Begal', 'ic_crime'],
    ['Laka Lantas Solo–Yogya', 'ic_traffic'],
    ['Gangguan Kamtibmas', 'ic_kamtibmas'],
    ['Bencana / Fasilitas Publik', 'ic_public_facility']
  ];
  for (const [name, icon] of categories) {
    await conn.query('INSERT INTO categories (category_name, icon_code) VALUES (?, ?) ON DUPLICATE KEY UPDATE icon_code=VALUES(icon_code)', [name, icon]);
  }

  const wargaHash = await bcrypt.hash(process.env.SEED_CITIZEN_PASSWORD || 'warga123', 10);
  const officerHash = await bcrypt.hash(process.env.SEED_OFFICER_PASSWORD || 'polsek123', 10);

  const users = [
    [uuidv4(), '3310012105040231', 'Rayvanza Davida (Warga)', 'warga.prambanan@demo.id', wargaHash, '081234560231', 'PELAPOR', null, null],
    [uuidv4(), null, 'Aiptu Bambang Sutrisno', 'spkt.prambanan@polri.go.id', officerHash, '0274496110', 'OFFICER', '98040231', 'SPKT Polsek Prambanan'],
    [uuidv4(), null, 'Bripka Hendra Wijaya', 'lantas.prambanan@polri.go.id', officerHash, '081227001122', 'OFFICER', '96110512', 'Unit Lantas Polsek Prambanan'],
    [uuidv4(), null, 'Ipda Dimas Prakoso, S.H.', 'reskrim.prambanan@polri.go.id', officerHash, '081328009988', 'OFFICER', '95080844', 'Unit Reskrim Polsek Prambanan']
  ];

  for (const u of users) {
    await conn.query(
      `INSERT INTO users (user_id, nik, full_name, email, password_hash, phone_number, role, badge_number, unit_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), unit_name=VALUES(unit_name)`,
      u
    );
  }

  console.log('BERHASIL SEEDING DATABASE!');
  await conn.end();
}

runSeeder().catch(err => { console.error('ERROR:', err.message); process.exit(1); });

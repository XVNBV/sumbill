import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'sumbill.db');

import fs from 'node:fs';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    nominal REAL,
    kategori TEXT DEFAULT 'Lainnya',
    tipe TEXT DEFAULT 'offline',
    sumber_bayar TEXT DEFAULT 'Lainnya',
    tanggal TEXT,
    catatan TEXT,
    ocr_text TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_bills_user ON bills(user_id);
`);

export function ensureSumberBayar() {
  const cols = db.prepare(`PRAGMA table_info(bills)`).all();
  if (!cols.some((c) => c.name === 'sumber_bayar')) {
    db.exec(`ALTER TABLE bills ADD COLUMN sumber_bayar TEXT DEFAULT 'Lainnya'`);
  }
}
ensureSumberBayar();

export default db;

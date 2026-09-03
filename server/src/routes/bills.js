import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db from '../db.js';
import { authRequired } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('File harus berupa gambar'));
  },
});

const KATEGORI = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Online / QRIS',
  'Hiburan',
  'Kesehatan',
  'Lainnya',
];

function sanitizeBill(row) {
  return {
    id: row.id,
    file_path: row.file_path,
    nominal: row.nominal,
    kategori: row.kategori,
    tipe: row.tipe,
    sumber_bayar: row.sumber_bayar,
    tanggal: row.tanggal,
    catatan: row.catatan,
    ocr_text: row.ocr_text,
    status: row.status,
    created_at: row.created_at,
  };
}

router.use(authRequired);

router.post('/', upload.single('foto'), (req, res) => {
  const body = req.body || {};
  const kategori = KATEGORI.includes(body.kategori) ? body.kategori : 'Lainnya';
  const tipe = body.tipe === 'online' ? 'online' : 'offline';
  const tanggal = body.tanggal || new Date().toISOString().slice(0, 10);
  const nominal = body.nominal !== undefined && body.nominal !== ''
    ? parseFloat(body.nominal)
    : null;
  const status = body.status === 'verified' ? 'verified' : 'pending';
  const sumberBayar =
    typeof body.sumber_bayar === 'string' && body.sumber_bayar.trim()
      ? body.sumber_bayar.trim()
      : 'Lainnya';

  const filePath = req.file ? `/uploads/${req.file.filename}` : '';
  const info = db
    .prepare(
      `INSERT INTO bills
       (user_id, file_path, nominal, kategori, tipe, sumber_bayar, tanggal, catatan, ocr_text, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      filePath,
      nominal,
      kategori,
      tipe,
      sumberBayar,
      tanggal,
      body.catatan || null,
      body.ocr_text || null,
      status
    );

  const row = db
    .prepare('SELECT * FROM bills WHERE id = ?')
    .get(Number(info.lastInsertRowid));
  res.status(201).json({ bill: sanitizeBill(row) });
});

router.get('/', (req, res) => {
  const { kategori, tipe, status, q, from, to } = req.query;
  const clauses = ['user_id = ?'];
  const params = [req.user.id];

  if (kategori) {
    clauses.push('kategori = ?');
    params.push(kategori);
  }
  if (tipe) {
    clauses.push('tipe = ?');
    params.push(tipe);
  }
  if (status) {
    clauses.push('status = ?');
    params.push(status);
  }
  if (q) {
    clauses.push('(catatan LIKE ? OR CAST(nominal AS TEXT) LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (from) {
    clauses.push('tanggal >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('tanggal <= ?');
    params.push(to);
  }

  const rows = db
    .prepare(`SELECT * FROM bills WHERE ${clauses.join(' AND ')} ORDER BY tanggal DESC, created_at DESC`)
    .all(...params);

  res.json({ bills: rows.map(sanitizeBill) });
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ message: 'Nota tidak ditemukan' });
  res.json({ bill: sanitizeBill(row) });
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ message: 'Nota tidak ditemukan' });

  const body = req.body || {};
  const kategori = KATEGORI.includes(body.kategori) ? body.kategori : row.kategori;
  const tipe = body.tipe === 'online' || body.tipe === 'offline' ? body.tipe : row.tipe;
  const tanggal = body.tanggal || row.tanggal;
  const nominal = body.nominal !== undefined && body.nominal !== ''
    ? parseFloat(body.nominal)
    : row.nominal;
  const status = body.status === 'verified' || body.status === 'pending' ? body.status : row.status;
  const sumberBayar =
    typeof body.sumber_bayar === 'string' && body.sumber_bayar.trim()
      ? body.sumber_bayar.trim()
      : row.sumber_bayar;

  db.prepare(
    `UPDATE bills SET nominal = ?, kategori = ?, tipe = ?, sumber_bayar = ?, tanggal = ?, catatan = ?, status = ? WHERE id = ?`
  ).run(nominal, kategori, tipe, sumberBayar, tanggal, body.catatan ?? row.catatan, status, row.id);

  const updated = db.prepare('SELECT * FROM bills WHERE id = ?').get(row.id);
  res.json({ bill: sanitizeBill(updated) });
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM bills WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ message: 'Nota tidak ditemukan' });
  db.prepare('DELETE FROM bills WHERE id = ?').run(row.id);
  if (row.file_path) {
    const absPath = path.join(__dirname, '..', '..', row.file_path.replace(/^\/uploads\//, 'uploads/'));
    try {
      if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch {}
  }
  res.json({ message: 'Nota dihapus' });
});

export { router as default, KATEGORI };

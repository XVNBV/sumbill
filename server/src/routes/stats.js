import { Router } from 'express';
import db from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();
router.use(authRequired);

function isoGroup(value) {
  if (!value) return value;
  return value.replace('T', ' ').replace('Z', '');
}

router.get('/summary', (req, res) => {
  const { from, to } = req.query;
  const clauses = ['user_id = ?'];
  const params = [req.user.id];
  if (from) { clauses.push('tanggal >= ?'); params.push(from); }
  if (to) { clauses.push('tanggal <= ?'); params.push(to); }

  const where = clauses.join(' AND ');

  const total = db
    .prepare(`SELECT COALESCE(SUM(nominal),0) AS total FROM bills WHERE ${where}`)
    .get(...params);
  const count = db
    .prepare(`SELECT COUNT(*) AS c FROM bills WHERE ${where}`)
    .get(...params);
  const verified = db
    .prepare(`SELECT COUNT(*) AS c FROM bills WHERE ${where} AND status='verified'`)
    .get(...params);

  const byKategori = db
    .prepare(`SELECT kategori, COALESCE(SUM(nominal),0) AS total, COUNT(*) AS jumlah FROM bills WHERE ${where} GROUP BY kategori ORDER BY total DESC`)
    .all(...params);
  const byTipe = db
    .prepare(`SELECT tipe, COALESCE(SUM(nominal),0) AS total, COUNT(*) AS jumlah FROM bills WHERE ${where} GROUP BY tipe`)
    .all(...params);

  const byTanggal = db
    .prepare(`SELECT tanggal, COALESCE(SUM(nominal),0) AS total, COUNT(*) AS jumlah FROM bills WHERE ${where} GROUP BY tanggal ORDER BY tanggal`)
    .all(...params);

  res.json({
    total: total.total,
    count: count.c,
    verified: verified.c,
    byKategori,
    byTipe,
    byTanggal,
  });
});

router.get('/export.csv', (req, res) => {
  const { kategori, tipe, status, from, to } = req.query;
  const clauses = ['user_id = ?'];
  const params = [req.user.id];
  if (kategori) { clauses.push('kategori = ?'); params.push(kategori); }
  if (tipe) { clauses.push('tipe = ?'); params.push(tipe); }
  if (status) { clauses.push('status = ?'); params.push(status); }
  if (from) { clauses.push('tanggal >= ?'); params.push(from); }
  if (to) { clauses.push('tanggal <= ?'); params.push(to); }

  const rows = db
    .prepare(`SELECT * FROM bills WHERE ${clauses.join(' AND ')} ORDER BY tanggal DESC`)
    .all(...params);

  const header = ['ID', 'Tanggal', 'Nominal', 'Kategori', 'Tipe', 'Status', 'Catatan'];
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.id,
      esc(r.tanggal),
      r.nominal ?? '',
      esc(r.kategori),
      esc(r.tipe),
      esc(r.status),
      esc(r.catatan),
    ].join(','));
  }

  // UTF-8 BOM supaya Excel membaca aksara Indonesia dengan benar
  const csv = '\uFEFF' + lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sumbill-export.csv"');
  res.send(csv);
});

export default router;

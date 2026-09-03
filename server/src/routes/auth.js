import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

function validateUsername(username) {
  const s = String(username || '').trim();
  return s.length >= 1 && !/\s/.test(s) && !/[\u0000-\u001f]/.test(s);
}

router.post('/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }
  if (!validateUsername(email)) {
    return res.status(400).json({ message: 'Username tidak valid: tidak boleh kosong, mengandung spasi, atau karakter aneh' });
  }
  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ message: 'Password minimal 6 karakter' });
  }
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ message: 'Username sudah terdaftar' });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const info = db
    .prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
    .run(email.toLowerCase(), hash);
  const user = { id: Number(info.lastInsertRowid), email: email.toLowerCase() };
  res.status(201).json({ token: signToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi' });
  }
  const user = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ message: 'Username atau password salah' });
  }
  const safe = { id: user.id, email: user.email };
  res.json({ token: signToken(safe), user: safe });
});

export default router;

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sumbill-secret-key-ganti-ini';

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'Tidak terautentikasi' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Sesi tidak valid' });
  }
}

export default JWT_SECRET;

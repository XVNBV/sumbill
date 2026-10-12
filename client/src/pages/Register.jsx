import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import inputBase, { Field } from '../components/Field.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Email wajib diisi.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) { setError('Password minimal 6 karakter.'); return; }
    if (password !== confirm) { setError('Konfirmasi password tidak cocok.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await register(email.trim(), password);
      if (res?.needsConfirmation) {
        setRegistered(email.trim());
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt="SumBill"
            className="h-12 w-12 object-contain"
          />
          <h1 className="title text-2xl">Buat akun</h1>
          <p className="text-sm text-muted">Mulai catat pengeluaran dari foto nota</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <Field label="Email" htmlFor="email" hint="Untuk login & verifikasi">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={inputBase}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mis. kamu@email.com"
            />
          </Field>
          <Field label="Password" htmlFor="password" hint="Minimal 6 karakter">
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              className={inputBase}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Field label="Ulangi password" htmlFor="confirm">
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              className={inputBase}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full font-display tracking-[0.14em]"
          >
            {submitting ? 'BUAT AKUN…' : 'BUAT AKUN'}
          </button>
        </form>

        {registered && (
          <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-center">
            <p className="font-display text-sm font-bold tracking-[0.12em] text-warning">
              DAFTAR BERHASIL
            </p>
            <p className="mt-2  text-sm text-ink">
              Akun <span className="text-primary">{registered}</span> berhasil dibuat.
            </p>
            <p className="mt-1  text-xs text-muted">
              Kami sudah mengirim link verifikasi ke email kamu.
              <br />
              Silakan cek inbox (atau folder spam) lalu klik link untuk mengaktifkan akun.
            </p>
            <Link
              to="/login"
              className="btn-ghost mt-3 inline-block px-4 py-2 text-xs"
            >
              Lanjut ke masuk
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
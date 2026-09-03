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

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(email, password);
      navigate('/');
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
          <h1 className="neon-title text-xl" style={{ textShadow: '0 0 18px rgba(255,93,240,0.45)' }}>
            DAFTAR AKUN
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-dim">
            // buat node baru
          </p>
        </div>

        <form onSubmit={onSubmit} className="hud-panel space-y-4 p-6">
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className={inputBase}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
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
            <p className="rounded-lg border border-blood/40 bg-blood/10 px-3 py-2 font-mono text-sm text-blood">
              ! {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-neon w-full font-display tracking-[0.14em]"
          >
            {submitting ? 'BUAT AKUN…' : 'BUAT AKUN'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-dim">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-mono font-medium text-neon hover:underline">
            [ masuk ]
          </Link>
        </p>
      </div>
    </div>
  );
}
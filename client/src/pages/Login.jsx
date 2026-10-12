import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import inputBase, { Field } from '../components/Field.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError('Email wajib diisi.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
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
            className="h-24 w-24 object-contain"
          />
          <h1 className="title text-2xl">SumBill</h1>
          <p className="text-sm text-muted">Kelola pengeluaran dari foto nota</p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4 p-6">
          <Field label="Email" htmlFor="email">
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
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputBase}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? 'MASUK…' : 'MASUK'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
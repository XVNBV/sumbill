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
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
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
            className="h-56 w-56 animate-flicker object-contain"
          />
          <h1 className="neon-title text-xl">SUMBILL</h1>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-dim">
            // akses terminal nota
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
            <p className="rounded-lg border border-blood/40 bg-blood/10 px-3 py-2 font-mono text-sm text-blood">
              ! {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-neon w-full font-display tracking-[0.14em]"
          >
            {submitting ? 'MASUK…' : 'MASUK'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-dim">
          Belum punya akun?{' '}
          <Link to="/register" className="font-mono font-medium text-neon hover:underline">
            [ daftar ]
          </Link>
        </p>
      </div>
    </div>
  );
}
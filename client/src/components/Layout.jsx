import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src="/logo.png"
              alt="SumBill"
              className="h-16 w-16 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-display text-base font-bold tracking-[0.18em] text-brk transition-colors group-hover:text-neon">
              SUMBILL
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 text-xs text-dim md:flex">
              <span className="font-mono uppercase tracking-[0.18em]">Node</span>
              <span className="flex items-center gap-1.5 rounded-md border border-line bg-panel px-2 py-0.5 font-mono text-neon">
                <span className="h-1.5 w-1.5 animate-pulseNeon rounded-full bg-neon" />
                {user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn-ghost px-3 py-1.5 font-display text-xs tracking-[0.12em]"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
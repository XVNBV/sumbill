const inputBase =
  'w-full rounded-lg border border-edge bg-void/70 px-3 py-2 text-sm text-brk placeholder:text-dim/70 transition-colors focus:border-neon/70 focus:outline-none focus:shadow-neon-sm';

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="hud-label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-dim">{hint}</p>}
      {error && <p className="font-mono text-xs font-medium text-blood">{error}</p>}
    </div>
  );
}

export default inputBase;
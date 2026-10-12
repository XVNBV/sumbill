const inputBase =
  'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-link focus:outline-none focus:ring-2 focus:ring-link/20';

export function Field({ label, htmlFor, hint, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className=" text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export default inputBase;
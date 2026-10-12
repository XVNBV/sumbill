import { monthLabel, isSameMonth } from '../utils/date.js';

const inputBase =
  'rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink transition-colors focus:border-link focus:outline-none focus:ring-2 focus:ring-link/20';

const chipBase =
  'rounded-md border border-line bg-surface px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:bg-surface2 hover:text-ink focus:outline-none focus:ring-2 focus:ring-link/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-muted';

export default function FilterBar({
  filters,
  setFilters,
  kategoriList,
  mode,
  onModeChange,
  month,
  onStepMonth,
  onThisMonth,
  onReset,
}) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const modeBtn = (value, label) => (
    <button
      key={value}
      type="button"
      onClick={() => onModeChange(value)}
      aria-pressed={mode === value}
      className={`rounded px-2.5 py-1.5 text-xs font-semibold tracking-[0.04em] transition-colors ${
        mode === value
          ? 'bg-surface text-ink shadow-card'
          : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1 rounded-md border border-line bg-surface2 p-0.5">
        {modeBtn('month', 'Bulan ini')}
        {modeBtn('range', 'Rentang bebas')}
      </div>

      {mode === 'month' ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onStepMonth(-1)}
            className={`${chipBase} px-2.5`}
            aria-label="Bulan sebelumnya"
            title="Bulan sebelumnya"
          >
            ‹
          </button>
          <span className="min-w-[9.5rem] text-center text-sm font-semibold text-ink">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => onStepMonth(1)}
            className={`${chipBase} px-2.5`}
            aria-label="Bulan berikutnya"
            title="Bulan berikutnya"
          >
            ›
          </button>
          <button
            type="button"
            onClick={onThisMonth}
            disabled={isSameMonth(month, new Date())}
            className={chipBase}
          >
            Bulan ini
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => set('from', e.target.value)}
            className={inputBase}
            aria-label="Dari tanggal"
          />
          <span className="text-xs text-muted">s/d</span>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => set('to', e.target.value)}
            className={inputBase}
            aria-label="Sampai tanggal"
          />
          <button type="button" onClick={onThisMonth} className={chipBase}>
            Kembali ke bulan ini
          </button>
        </div>
      )}

      <input
        type="search"
        placeholder="cari catatan / nominal…"
        value={filters.q}
        onChange={(e) => set('q', e.target.value)}
        className={`${inputBase} w-52 placeholder:text-muted/70`}
      />
      <select
        value={filters.kategori}
        onChange={(e) => set('kategori', e.target.value)}
        className={inputBase}
        aria-label="Filter kategori"
      >
        <option value="" className="bg-surface">Semua kategori</option>
        {kategoriList.map((k) => (
          <option key={k} value={k} className="bg-surface">
            {k}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => set('status', e.target.value)}
        className={inputBase}
        aria-label="Filter status"
      >
        <option value="" className="bg-surface">Semua status</option>
        <option value="verified" className="bg-surface">Terverifikasi</option>
        <option value="pending" className="bg-surface">Perlu verifikasi</option>
      </select>

      {(filters.q || filters.kategori || filters.status || filters.from || filters.to || mode === 'range') && (
        <button type="button" onClick={onReset} className={chipBase}>
          Reset
        </button>
      )}
    </div>
  );
}

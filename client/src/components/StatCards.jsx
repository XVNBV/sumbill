import { formatIDR, formatDate } from '../utils/format.js';

function Card({ title, value, sub, accent }) {
  return (
    <div className="card p-5">
      <p className="label">{title}</p>
      <p className={`tabular mt-2  text-2xl font-bold tracking-tight ${accent || 'text-ink'}`}>
        {value}
      </p>
      {sub && <p className="mt-1  text-xs text-muted">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className="truncate  text-muted">{label}</span>
        <span className="tabular shrink-0  font-medium text-ink">{formatIDR(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function StatCards({ stats, periodeLabel, selectedTanggal, onBarClick }) {
  if (!stats) return null;
  const maxCat = stats.byKategori.reduce((m, k) => Math.max(m, k.total), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <Card
          title="Total belanja"
          value={formatIDR(stats.total)}
          accent="amount"
          sub={periodeLabel ? `${stats.count} nota · ${periodeLabel}` : `${stats.count} nota tercatat`}
        />
      </div>

      {stats.byKategori.length > 0 && (
        <div className="card p-5">
          <h3 className="label mb-4">Per kategori</h3>
          <div className="space-y-3">
            {stats.byKategori.map((k) => (
              <MiniBar
                key={k.kategori}
                label={k.kategori}
                value={k.total}
                max={maxCat}
                color="bg-primary"
              />
            ))}
          </div>
        </div>
      )}

      <div className="card p-5 lg:col-span-2">
        <h3 className="label mb-4">Pengeluaran per tanggal</h3>
        {stats.byTanggal.length === 0 ? (
          <p className=" text-sm text-muted">Belum ada data pada rentang ini.</p>
        ) : (
          <div className="flex h-40 items-end gap-1.5">
            {stats.byTanggal.map((t) => {
              const max = Math.max(...stats.byTanggal.map((x) => x.total));
              const px = max > 0 ? Math.max(8, (t.total / max) * 112) : 8;
              const active = selectedTanggal === t.tanggal;
              return (
                <div
                  key={t.tanggal}
                  className="group relative flex flex-1 flex-col items-center justify-end gap-1"
                  style={{ height: '100%' }}
                >
                  <button
                    type="button"
                    onClick={() => onBarClick?.(t.tanggal)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onBarClick?.(t.tanggal);
                      }
                    }}
                    className={`w-full rounded-t-md transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 ${
                      active
                        ? 'bg-accent'
                        : 'cursor-pointer bg-primary/60 group-hover:bg-primary'
                    }`}
                    style={{ height: `${px}px` }}
                    title={`${formatDate(t.tanggal)} — ${formatIDR(t.total)} — klik untuk lihat daftar`}
                    aria-label={`Lihat pengeluaran tanggal ${formatDate(t.tanggal)}`}
                  />
                  <span
                    className={`max-w-full truncate  text-[10px] ${
                      active ? 'font-bold text-accent' : 'text-muted'
                    }`}
                  >
                    {formatDate(t.tanggal).split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
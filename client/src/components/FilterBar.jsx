const inputBase =
  'rounded-lg border border-edge bg-void/70 px-3 py-2 text-sm text-brk transition-colors focus:border-neon/70 focus:outline-none focus:shadow-neon-sm';

export default function FilterBar({ filters, setFilters, kategoriList }) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <input
        type="search"
        placeholder="cari catatan / nominal…"
        value={filters.q}
        onChange={(e) => set('q', e.target.value)}
        className={`${inputBase} w-52 placeholder:text-dim/70`}
      />
      <select
        value={filters.kategori}
        onChange={(e) => set('kategori', e.target.value)}
        className={inputBase}
        aria-label="Filter kategori"
      >
        <option value="" className="bg-panel">Semua kategori</option>
        {kategoriList.map((k) => (
          <option key={k} value={k} className="bg-panel">
            {k}
          </option>
        ))}
      </select>
      <select
        value={filters.tipe}
        onChange={(e) => set('tipe', e.target.value)}
        className={inputBase}
        aria-label="Filter jenis nota"
      >
        <option value="" className="bg-panel">Semua jenis</option>
        <option value="offline" className="bg-panel">Offline</option>
        <option value="online" className="bg-panel">Online</option>
      </select>
      <select
        value={filters.status}
        onChange={(e) => set('status', e.target.value)}
        className={inputBase}
        aria-label="Filter status"
      >
        <option value="" className="bg-panel">Semua status</option>
        <option value="verified" className="bg-panel">Terverifikasi</option>
        <option value="pending" className="bg-panel">Perlu verifikasi</option>
      </select>
      <input
        type="date"
        value={filters.from}
        onChange={(e) => set('from', e.target.value)}
        className={inputBase}
        aria-label="Dari tanggal"
      />
      <input
        type="date"
        value={filters.to}
        onChange={(e) => set('to', e.target.value)}
        className={inputBase}
        aria-label="Sampai tanggal"
      />
      {(filters.q || filters.kategori || filters.tipe || filters.status || filters.from || filters.to) && (
        <button
          onClick={() =>
            setFilters({ q: '', kategori: '', tipe: '', status: '', from: '', to: '' })
          }
          className="rounded-lg px-2 py-2 font-mono text-sm text-dim hover:text-neon"
        >
          [reset]
        </button>
      )}
    </div>
  );
}
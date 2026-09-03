import { useEffect, useCallback, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import UploadForm from '../components/UploadForm.jsx';
import BillCard from '../components/BillCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import StatCards from '../components/StatCards.jsx';
import { api, downloadExport } from '../api.js';
import { formatDate } from '../utils/format.js';

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [kategoriList, setKategoriList] = useState([]);
  const [filters, setFilters] = useState({
    q: '', kategori: '', tipe: '', status: '', from: '', to: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.kategori) params.set('kategori', filters.kategori);
    if (filters.tipe) params.set('tipe', filters.tipe);
    if (filters.status) params.set('status', filters.status);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    const s = params.toString();
    return s ? `?${s}` : '';
  }, [filters]);

  const load = useCallback(async () => {
    setLoading(true);
    const query = buildQuery();
    try {
      const [billsRes, statsRes, katRes] = await Promise.all([
        api(`/bills${query}`),
        api(`/stats/summary${query}`),
        api('/kategori'),
      ]);
      setBills(billsRes.bills);
      setStats(statsRes);
      setKategoriList(katRes.kategori);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters(next) {
    setFilters(next);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadExport(buildQuery());
      showToast('Data berhasil diunduh sebagai CSV');
    } catch (err) {
      showToast(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="neon-title text-2xl">
            {showForm ? 'Tambah nota' : 'Daftar nota'}
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-dim">
            &gt; kumpulkan nominal dari foto nota pembayaran
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting} className="btn-ghost">
            {exporting ? 'Menyiapkan…' : 'Ekspor CSV'}
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="btn-neon font-display tracking-[0.12em]"
          >
            {showForm ? 'TUTUP' : '+ NOTA'}
          </button>
        </div>
      </div>

      {showForm && (
        <UploadForm
          onSaved={() => {
            setShowForm(false);
            load();
            showToast('Nota berhasil disimpan');
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="mt-6">
        <StatCards
          stats={stats}
          selectedTanggal={selectedDate}
          onBarClick={(tanggal) => setSelectedDate((cur) => (cur === tanggal ? null : tanggal))}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <FilterBar filters={filters} setFilters={applyFilters} kategoriList={kategoriList} />
      </div>

      {selectedDate && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-mag/40 bg-mag/10 px-3 py-2">
          <span className="font-mono text-sm text-mag">
            &gt; pengeluaran {formatDate(selectedDate)}
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="font-mono text-xs text-dim hover:text-neon"
          >
            [tampilkan semua]
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-panel" />
          ))}
        </div>
      ) : (() => {
        const visibleBills = selectedDate
          ? bills.filter((b) => b.tanggal === selectedDate)
          : bills;
        return visibleBills.length === 0 ? (
          <div className="hud-panel mt-6 flex flex-col items-center justify-center border-dashed px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-neon/40 bg-neon/10 text-neon shadow-neon-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
            </span>
            <h2 className="mt-4 font-display text-base font-bold tracking-[0.12em] text-brk">
              {selectedDate ? 'TAK ADA NOTA' : 'BELUM ADA NOTA'}
            </h2>
            <p className="mt-1 max-w-sm font-mono text-sm text-dim">
              {selectedDate
                ? `&gt; tidak ada nota pada ${formatDate(selectedDate)}.`
                : showForm
                  ? '&gt; pilih foto nota lalu biarkan OCR membaca nominalnya.'
                  : '&gt; klik "Tambah nota" untuk unggah foto atau screenshot transaksi.'}
            </p>
            {!showForm && !selectedDate && (
              <button
                onClick={() => setShowForm(true)}
                className="btn-neon mt-4 font-display tracking-[0.12em]"
              >
                + NOTA
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {visibleBills.map((bill) => (
              <BillCard key={bill.id} bill={bill} />
            ))}
          </div>
        );
      })()}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-neon/50 bg-void/95 px-4 py-2.5 font-mono text-sm text-neon shadow-neon">
          &gt; {toast}
        </div>
      )}
    </Layout>
  );
}
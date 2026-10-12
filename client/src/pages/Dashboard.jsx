import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import UploadForm from '../components/UploadForm.jsx';
import BillCard from '../components/BillCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import StatCards from '../components/StatCards.jsx';
import { api, downloadExport } from '../api.js';
import { getPendingShareFile, clearShareParam } from '../utils/shareTarget.js';
import { formatDate } from '../utils/format.js';
import { startOfMonth, endOfMonth, addMonths, monthLabel } from '../utils/date.js';

const EMPTY_FILTERS = { q: '', kategori: '', status: '', from: '', to: '' };

export default function Dashboard() {
  const [bills, setBills] = useState([]);
  const [stats, setStats] = useState(null);
  const [kategoriList, setKategoriList] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [month, setMonth] = useState(() => new Date());
  const [mode, setMode] = useState('month');
  const [showForm, setShowForm] = useState(false);
  const [sharedFile, setSharedFile] = useState(null);
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

  const monthRange = useMemo(
    () => ({ from: startOfMonth(month), to: endOfMonth(month) }),
    [month],
  );

  const periodeLabel = useMemo(() => {
    if (mode === 'month') return monthLabel(month);
    const { from, to } = filters;
    if (from && to) return `${formatDate(from)} s/d ${formatDate(to)}`;
    if (from) return `dari ${formatDate(from)}`;
    if (to) return `sampai ${formatDate(to)}`;
    return 'semua tanggal';
  }, [mode, month, filters.from, filters.to]);

  const buildQuery = useCallback(() => {
    const f = mode === 'month' ? { ...filters, ...monthRange } : filters;
    const params = new URLSearchParams();
    if (f.q) params.set('q', f.q);
    if (f.kategori) params.set('kategori', f.kategori);
    if (f.status) params.set('status', f.status);
    if (f.from) params.set('from', f.from);
    if (f.to) params.set('to', f.to);
    const s = params.toString();
    return s ? `?${s}` : '';
  }, [filters, mode, monthRange]);

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

  useEffect(() => {
    getPendingShareFile().then((file) => {
      clearShareParam();
      if (file) {
        setSharedFile(file);
        setShowForm(true);
      }
    });
  }, []);

  function applyFilters(next) {
    if (next.from !== filters.from || next.to !== filters.to) {
      setSelectedDate(null);
      if (mode === 'month' && (next.from !== monthRange.from || next.to !== monthRange.to)) {
        setMode('range');
      }
    }
    setFilters(next);
  }

  function changeMode(next) {
    if (next === mode) return;
    if (next === 'range') {
      setFilters((f) => (f.from || f.to ? f : { ...f, ...monthRange }));
    }
    setSelectedDate(null);
    setMode(next);
  }

  function stepMonth(n) {
    setSelectedDate(null);
    setMonth((m) => addMonths(m, n));
  }

  function goThisMonth() {
    setSelectedDate(null);
    setMonth(new Date());
    setMode('month');
  }

  function resetFilters() {
    setSelectedDate(null);
    setFilters(EMPTY_FILTERS);
    goThisMonth();
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
          <h1 className="title text-2xl">
            {showForm ? 'Tambah nota' : 'Daftar nota'}
          </h1>
          <p className="mt-1 text-sm text-muted">Kumpulkan nominal dari foto nota pembayaran</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting} className="btn-ghost">
            {exporting ? 'Menyiapkan…' : 'Ekspor CSV'}
          </button>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setSharedFile(null);
            }}
            className="btn-primary"
          >
            {showForm ? 'Tutup' : 'Tambah nota'}
          </button>
        </div>
      </div>

      {showForm && (
        <UploadForm
          initialFile={sharedFile}
          onSaved={() => {
            setShowForm(false);
            setSharedFile(null);
            load();
            showToast('Nota berhasil disimpan');
          }}
          onCancel={() => {
            setShowForm(false);
            setSharedFile(null);
          }}
        />
      )}

      <div className="mt-6">
        <StatCards
          stats={stats}
          periodeLabel={periodeLabel}
          selectedTanggal={selectedDate}
          onBarClick={(tanggal) => setSelectedDate((cur) => (cur === tanggal ? null : tanggal))}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <FilterBar
          filters={filters}
          setFilters={applyFilters}
          kategoriList={kategoriList}
          mode={mode}
          onModeChange={changeMode}
          month={month}
          onStepMonth={stepMonth}
          onThisMonth={goThisMonth}
          onReset={resetFilters}
        />
      </div>

      {selectedDate && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/30 bg-accent/5 px-3 py-2">
          <span className="text-sm font-medium text-accent">
            Pengeluaran {formatDate(selectedDate)}
          </span>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-xs text-muted hover:text-primary"
          >
            Tampilkan semua
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-line bg-surface" />
          ))}
        </div>
      ) : (() => {
        const visibleBills = selectedDate
          ? bills.filter((b) => b.tanggal === selectedDate)
          : bills;
        return visibleBills.length === 0 ? (
          <div className="card mt-6 flex flex-col items-center justify-center border-dashed px-6 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
            </span>
            <h2 className="mt-4 font-display text-lg font-bold text-ink">
              {selectedDate ? 'Tidak ada nota' : 'Belum ada nota'}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {selectedDate
                ? `Tidak ada nota pada ${formatDate(selectedDate)}.`
                : showForm
                  ? 'Pilih foto nota lalu biarkan OCR membaca nominalnya.'
                  : 'Klik "Tambah nota" untuk mengunggah foto atau screenshot transaksi.'}
            </p>
            {!showForm && !selectedDate && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setSharedFile(null);
                }}
                className="btn-primary mt-4"
              >
                Tambah nota
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
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border border-ink bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-cardHover">
          {toast}
        </div>
      )}
    </Layout>
  );
}
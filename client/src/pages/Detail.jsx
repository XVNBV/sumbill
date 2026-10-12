import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import inputBase, { Field } from '../components/Field.jsx';
import { api } from '../api.js';
import { formatIDR, formatDate, STATUS_LABEL, STATUS_BADGE } from '../utils/format.js';
import { todayLocal } from '../utils/date.js';

const SUMBER_BAYAR = [
  'Bank Mandiri',
  'Bank BCA',
  'Bank BNI',
  'Bank BRI',
  'Bank BSI',
  'CIMB Niaga',
  'Bank Permata',
  'Maybank',
  'Bank Danamon',
  'SeaBank',
  'Jenius',
  'Blu',
  'GoPay',
  'OVO',
  'DANA',
  'ShopeePay',
  'LinkAja',
  'Cash',
  'Lainnya',
];

function normalizeSumberBayar(v) {
  return SUMBER_BAYAR.includes(v) ? v : 'Lainnya';
}

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api(`/bills/${id}`)
      .then((res) => {
        setBill(res.bill);
        setForm({
          nominal: res.bill.nominal ?? '',
          kategori: res.bill.kategori,
          sumber_bayar: normalizeSumberBayar(res.bill.sumber_bayar),
          tanggal: res.bill.tanggal || todayLocal(),
          catatan: res.bill.catatan || '',
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (form.nominal === '' || Number.isNaN(Number(String(form.nominal).replace(/\./g, '').replace(',', '.')))) {
      setError('Nominal wajib diisi dengan angka yang valid.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api(`/bills/${id}`, {
        method: 'PUT',
        body: {
          ...form,
          nominal: String(form.nominal).replace(/\./g, '').replace(',', '.'),
          status: form.nominal !== (bill.nominal ?? '') ? 'verified' : bill.status,
        },
      });
      setBill(res.bill);
      setForm({
        nominal: res.bill.nominal ?? '',
        kategori: res.bill.kategori,
        sumber_bayar: normalizeSumberBayar(res.bill.sumber_bayar),
        tanggal: res.bill.tanggal,
        catatan: res.bill.catatan || '',
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm('Hapus nota ini beserta fotonya?')) return;
    setDeleting(true);
    try {
      await api(`/bills/${id}`, { method: 'DELETE' });
      navigate('/');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />
      </Layout>
    );
  }

  if (error && !bill) {
    return (
      <Layout>
        <div className="card p-8 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Link to="/" className="mt-3 inline-block text-sm text-primary hover:underline">
            Kembali ke daftar
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Kembali
        </Link>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-ghost text-xs"
            >
              Perbarui
            </button>
          )}
          <button
            onClick={remove}
            disabled={deleting}
            className="btn-danger text-xs disabled:opacity-50"
          >
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden p-1">
          {bill.file_path ? (
            <img src={bill.file_path} alt="Nota" className="h-full max-h-[560px] w-full rounded-lg object-contain" />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center rounded-lg border-2 border-dashed border-warning/40 bg-warning/5 p-8 text-center">
              <span className="text-sm font-bold uppercase tracking-[0.08em] text-warning">
                Tanpa nota
                <br />
                Cash manual
              </span>
            </div>
          )}
        </div>

        <div className="card p-6">
          {!editing ? (
            <div className="space-y-4">
              <div>
                <p className="label">Nominal</p>
                <p className="tabular amount mt-1 text-3xl font-bold tracking-tight">
                  {formatIDR(bill.nominal)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`chip border ${STATUS_BADGE[bill.status]}`}>
                  {STATUS_LABEL[bill.status]}
                </span>
                <span className="chip border border-line bg-surface text-muted">
                  {bill.kategori}
                </span>
                {bill.sumber_bayar && bill.sumber_bayar !== 'Lainnya' && (
                  <span className="chip border border-accent/40 bg-accent/10 text-accent">
                    {bill.sumber_bayar}
                  </span>
                )}
              </div>
              <dl className="space-y-3 border-t border-line pt-4  text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Tanggal transaksi</dt>
                  <dd className="font-medium text-ink">{formatDate(bill.tanggal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Ditambahkan</dt>
                  <dd className="font-medium text-ink">{formatDate(bill.created_at)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Catatan</dt>
                  <dd className="text-right font-medium text-ink">
                    {bill.catatan || <span className="text-muted">—</span>}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-ink">Perbarui nota</h2>
              <Field label="Nominal (Rp)" htmlFor="nominal">
                <input
                  id="nominal"
                  className={inputBase}
                  value={form.nominal}
                  onChange={(e) => update('nominal', e.target.value)}
                />
              </Field>
              <Field label="Kategori" htmlFor="kategori">
                <select
                  id="kategori"
                  className={inputBase}
                  value={form.kategori}
                  onChange={(e) => update('kategori', e.target.value)}
                >
                  {['Makanan & Minuman', 'Transportasi', 'Belanja', 'Online / QRIS', 'Hiburan', 'Kesehatan', 'Lainnya'].map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sumber pembayaran" htmlFor="sumber-bayar">
                <select
                  id="sumber-bayar"
                  className={inputBase}
                  value={form.sumber_bayar || 'Lainnya'}
                  onChange={(e) => update('sumber_bayar', e.target.value)}
                >
                  {SUMBER_BAYAR.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tanggal transaksi" htmlFor="tanggal">
                <input
                  id="tanggal"
                  type="date"
                  className={inputBase}
                  value={form.tanggal}
                  onChange={(e) => update('tanggal', e.target.value)}
                />
              </Field>
              <Field label="Catatan (opsional)" htmlFor="catatan">
                <input
                  id="catatan"
                  className={inputBase}
                  value={form.catatan}
                  onChange={(e) => update('catatan', e.target.value)}
                />
              </Field>

              {error && <p className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="btn-ghost text-xs"
                >
                  Batal
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  {saving ? 'Menyimpan…' : 'Simpan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
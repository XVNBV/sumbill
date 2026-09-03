import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import inputBase, { Field } from '../components/Field.jsx';
import { api } from '../api.js';
import { formatIDR, formatDate, TIPE_LABEL, STATUS_LABEL, STATUS_BADGE, TIPE_BADGE } from '../utils/format.js';

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
  'QRIS',
  'Cash',
  'Lainnya',
];

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
          tipe: res.bill.tipe,
          sumber_bayar: res.bill.sumber_bayar || 'Lainnya',
          tanggal: res.bill.tanggal || new Date().toISOString().slice(0, 10),
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
        tipe: res.bill.tipe,
        sumber_bayar: res.bill.sumber_bayar || 'Lainnya',
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
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-panel" />
      </Layout>
    );
  }

  if (error && !bill) {
    return (
      <Layout>
        <div className="hud-panel p-8 text-center">
          <p className="font-mono text-sm text-blood">! {error}</p>
          <Link to="/" className="mt-3 inline-block font-mono text-sm text-neon hover:underline">
            &lt;kembali ke daftar
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 font-mono text-sm text-dim hover:text-neon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          &lt;kembali
        </Link>
        <div className="flex gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-ghost font-mono text-xs tracking-[0.1em]"
            >
              perbarui
            </button>
          )}
          <button
            onClick={remove}
            disabled={deleting}
            className="btn-danger font-mono text-xs tracking-[0.1em] disabled:opacity-50"
          >
            {deleting ? 'menghapus…' : 'hapus'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="hud-panel overflow-hidden p-1">
          {bill.file_path ? (
            <img src={bill.file_path} alt="Nota" className="h-full max-h-[560px] w-full rounded-lg object-contain" />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center rounded-lg border-2 border-dashed border-volt/40 bg-volt/5 p-8 text-center">
              <span className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-volt">
                tanpa nota<br />/ cash manual
              </span>
            </div>
          )}
        </div>

        <div className="hud-panel p-6">
          {!editing ? (
            <div className="space-y-4">
              <div>
                <p className="hud-label">Nominal</p>
                <p className="tabular neon-text mt-1 font-mono text-3xl font-bold tracking-tight">
                  {formatIDR(bill.nominal)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={`chip border ${STATUS_BADGE[bill.status]}`}>
                  {STATUS_LABEL[bill.status]}
                </span>
                <span className={`chip border ${TIPE_BADGE[bill.tipe]}`}>
                  {TIPE_LABEL[bill.tipe]}
                </span>
                <span className="chip border border-edge bg-panel text-dim">
                  {bill.kategori}
                </span>
                {bill.sumber_bayar && bill.sumber_bayar !== 'Lainnya' && (
                  <span className="chip border border-mag/40 bg-mag/10 text-mag">
                    {bill.sumber_bayar}
                  </span>
                )}
              </div>
              <dl className="space-y-3 border-t border-line pt-4 font-mono text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Tanggal transaksi</dt>
                  <dd className="font-medium text-brk">{formatDate(bill.tanggal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Ditambahkan</dt>
                  <dd className="font-medium text-brk">{formatDate(bill.created_at)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Catatan</dt>
                  <dd className="text-right font-medium text-brk">
                    {bill.catatan || <span className="text-dim">—</span>}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-display text-base font-bold tracking-[0.12em] text-brk">
                PERBARUI NOTA
              </h2>
              <Field label="Nominal (Rp)" htmlFor="nominal">
                <input
                  id="nominal"
                  className={inputBase}
                  value={form.nominal}
                  onChange={(e) => update('nominal', e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Jenis notas" htmlFor="tipe">
                  <select
                    id="tipe"
                    className={inputBase}
                    value={form.tipe}
                    onChange={(e) => update('tipe', e.target.value)}
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
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
              </div>
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

              {error && <p className="rounded-lg border border-blood/40 bg-blood/10 px-3 py-2 font-mono text-sm text-blood">! {error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="btn-ghost font-mono text-xs tracking-[0.1em]"
                >
                  batal
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-neon font-mono text-xs tracking-[0.1em] disabled:opacity-50"
                >
                  {saving ? 'simpan…' : 'simpan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
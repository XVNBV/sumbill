import { useRef, useState } from 'react';
import { runOcr, extractNominal } from '../utils/ocr.js';
import { api } from '../api.js';
import inputBase, { Field } from './Field.jsx';
import CameraCapture from './CameraCapture.jsx';

const KATEGORI = [
  'Makanan & Minuman',
  'Transportasi',
  'Belanja',
  'Online / QRIS',
  'Hiburan',
  'Kesehatan',
  'Lainnya',
];

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

export default function UploadForm({ onSaved, onCancel }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [manual, setManual] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [state, setState] = useState('idle'); // idle | busy | confirm
  const [progress, setProgress] = useState(0);
  const [nominal, setNominal] = useState('');
  const [tipe, setTipe] = useState('offline');
  const [kategori, setKategori] = useState('Lainnya');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState('');
  const [sumberBayar, setSumberBayar] = useState('Lainnya');
  const [ocrRaw, setOcrRaw] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ocrHint, setOcrHint] = useState(null);
  const inputRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setManual(false);
    setShowCamera(false);
    setError(null);
    setPreview(URL.createObjectURL(f));
    setState('idle');
  }

  function handleCapture(f) {
    setFile(f);
    setManual(false);
    setShowCamera(false);
    setError(null);
    setPreview(URL.createObjectURL(f));
    setState('idle');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function startOcr() {
    if (!file) return;
    setState('busy');
    setProgress(0);
    setOcrHint(null);
    try {
      const res = await runOcr(file, setProgress);
      setOcrRaw(res.text);
      if (res.sumberBayar) {
        setSumberBayar(res.sumberBayar);
      }
      if (res.nominal !== null) {
        setNominal(String(res.nominal));
        setOcrHint(
          res.detectedLabel
            ? `OCR membaca ${res.detectedLabel.toUpperCase()} sebagai nominal. Periksa kembali.`
            : 'OCR menemukan nominal. Periksa kembali sebelum simpan.'
        );
      } else {
        setOcrHint('OCR tidak menemukan nominal yang jelas. Silakan isi manual.');
      }
      setState('confirm');
    } catch (err) {
      setError('OCR gagal dijalankan. Periksa koneksi internet lalu coba lagi.');
      setState('idle');
    }
  }

  function resetOcrRetry() {
    setState('idle');
    setProgress(0);
    setOcrHint(null);
  }

  async function save() {
    if (nominal === '' || Number.isNaN(Number(nominal.replace(/\./g, '').replace(',', '.')))) {
      setError('Nominal wajib diisi dengan angka yang valid.');
      return;
    }
    setSaving(true);
    setError(null);
    const fd = new FormData();
    if (file) fd.append('foto', file);
    fd.append('nominal', nominal.replace(/\./g, '').replace(',', '.'));
    fd.append('tipe', tipe);
    fd.append('kategori', kategori);
    fd.append('tanggal', tanggal || new Date().toISOString().slice(0, 10));
    fd.append('catatan', catatan);
    fd.append('sumber_bayar', sumberBayar);
    fd.append('ocr_text', ocrRaw);
    fd.append('status', 'verified');
    try {
      await api('/bills', { method: 'POST', body: fd });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setPreview(null);
    setFile(null);
    setManual(false);
    setShowCamera(false);
    setState('idle');
    setProgress(0);
    setNominal('');
    setCatatan('');
    setOcrRaw('');
    setError(null);
    setOcrHint(null);
    setSumberBayar('Lainnya');
    setKategori('Lainnya');
    setTipe('offline');
    setTanggal(new Date().toISOString().slice(0, 10));
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="hud-panel p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold tracking-[0.12em] text-brk">
          TAMBAH NOTA
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="btn-ghost px-3 py-1.5 font-mono text-xs"
          >
            &lt; kembali
          </button>
        )}
      </div>

      {!file && !manual && (
        <div className="space-y-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-edge bg-void/50 px-4 py-10 text-center transition-colors hover:border-neon/60 hover:bg-neon/5">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
            />
            <span className="grid h-10 w-10 place-items-center rounded-full border border-neon/40 bg-neon/10 text-neon shadow-neon-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0 4 4m-4-4-4 4" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
            </span>
            <span className="font-mono text-sm font-medium text-brk">
              &gt; pilih foto nota / screenshot_
            </span>
            <span className="font-mono text-xs text-dim">
              nota fisik maupun transaksi online (QRIS / e-wallet)
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-xs text-dim">atau</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="btn-ghost w-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              ambil foto langsung
            </button>
            <button
              type="button"
              onClick={() => setManual(true)}
              className="btn-ghost w-full"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              input manual — tanpa foto
            </button>
          </div>
        </div>
      )}

      {manual && (
        <div className="flex items-center justify-between rounded-lg border border-volt/40 bg-volt/10 px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-[0.14em] text-volt">
            &gt; input manual — tanpa nota
          </span>
          <button
            type="button"
            onClick={() => {
              setManual(false);
              setError(null);
            }}
            className="font-mono text-xs text-dim hover:text-neon"
          >
            [batal]
          </button>
        </div>
      )}

      {(file || manual) && (
        <div className="space-y-4">
          {file && (
            <div className="flex items-start gap-3">
              <img
                src={preview}
                alt="Pratinjau nota"
                className="h-28 w-28 rounded-xl border border-edge object-cover"
              />
              <div className="flex-1">
                <p className="truncate font-mono text-sm text-brk">{file.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="btn-ghost px-3 py-1.5 font-mono text-xs"
                  >
                    ganti foto
                  </button>
                  {state === 'idle' && (
                    <button
                      type="button"
                      onClick={startOcr}
                      className="btn-neon px-3 py-1.5 font-mono text-xs tracking-[0.1em]"
                    >
                      baca OCR_
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {state === 'busy' && (
            <div className="rounded-xl border border-line bg-panel/60 p-4">
              <div className="mb-2 flex items-center justify-between font-mono text-sm">
                <span className="text-dim">membaca teks dari foto…</span>
                <span className="neon-text tabular">{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon to-mag shadow-neon-sm transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {(file && (state === 'confirm' || state === 'idle')) || manual ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Nominal (Rp)"
                htmlFor="nominal"
                hint={ocrHint || 'Nilai yang tercatat di nota'}
              >
                <input
                  id="nominal"
                  inputMode="decimal"
                  className={inputBase}
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="mis. 25000"
                />
              </Field>

              <Field label="Jenis nota" htmlFor="tipe">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipe('offline')}
                    className={`rounded-lg border px-3 py-2 font-mono text-sm font-medium transition-colors ${
                      tipe === 'offline'
                        ? 'border-neon bg-neon/15 text-neon shadow-neon-sm'
                        : 'border-edge bg-panel/60 text-dim hover:border-neon/50 hover:text-neon'
                    }`}
                  >
                    OFFLINE
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipe('online')}
                    className={`rounded-lg border px-3 py-2 font-mono text-sm font-medium transition-colors ${
                      tipe === 'online'
                        ? 'border-mag bg-mag/15 text-mag shadow-mag'
                        : 'border-edge bg-panel/60 text-dim hover:border-mag/50 hover:text-mag'
                    }`}
                  >
                    ONLINE
                  </button>
                </div>
              </Field>

              <Field label="Sumber pembayaran" htmlFor="sumber-bayar">
                <select
                  id="sumber-bayar"
                  className={inputBase}
                  value={sumberBayar}
                  onChange={(e) => setSumberBayar(e.target.value)}
                >
                  {SUMBER_BAYAR.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kategori" htmlFor="kategori">
                <select
                  id="kategori"
                  className={inputBase}
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  {KATEGORI.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tanggal transaksi" htmlFor="tanggal">
                <input
                  id="tanggal"
                  type="date"
                  className={inputBase}
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Catatan (opsional)" htmlFor="catatan">
                  <input
                    id="catatan"
                    className={inputBase}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="mis. Makan siang di kantin"
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {error && (
            <p className="rounded-lg border border-blood/40 bg-blood/10 px-3 py-2 font-mono text-sm text-blood">
              ! {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2">
            {state === 'confirm' && (
              <button
                type="button"
                onClick={resetOcrRetry}
                className="rounded-lg px-3 py-2 font-mono text-sm text-dim hover:text-neon"
              >
                [ulangi OCR]
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || !(manual || state === 'confirm')}
              className="btn-neon font-display tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? 'SIMPAN…' : 'SIMPAN NOTA'}
            </button>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture onCapture={handleCapture} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
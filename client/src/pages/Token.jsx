import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import inputBase, { Field } from '../components/Field.jsx';
import { listTokens, createToken, deleteToken } from '../api.js';
import { formatDate } from '../utils/format.js';

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-upload`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `sb_${b64}`;
}

async function sha256Hex(str) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Token() {
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState('');
  const [fresh, setFresh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await listTokens();
      setTokens(res.tokens);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Gagal menyalin. Salin manual ya.');
    }
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const token = randomToken();
      const hash = await sha256Hex(token);
      await createToken(label.trim(), hash);
      setFresh(token);
      setLabel('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    if (!window.confirm('Cabut token ini? Shortcut yang memakainya akan berhenti bekerja.')) return;
    try {
      await deleteToken(id);
      setTokens((list) => list.filter((t) => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const shortcutSteps = [
    { label: 'Buka app Shortcuts → tab Automation/Shortcut baru → Add Action.' },
    { label: 'Tambahkan action "Get Contents of URL".' },
    { label: `URL: ${ENDPOINT}` },
    { label: 'Method: POST.' },
    { label: 'Headers:' },
    { label: `Authorization = Bearer ${fresh || '<token>'}` },
    { label: `apikey = ${ANON_KEY}` },
    { label: 'Request Body: pilih "Form".' },
    { label: 'Tambah field baru, ketik nama "foto", lalu pilih variabel Shortcut Input (gambar).' },
    { label: 'Aktifkan "Show in Share Sheet" dan batasi tipe input ke Images.' },
    { label: 'Saran: tambahkan action "Convert Image" ke JPEG sebelum upload agar tampil di semua browser.' },
  ];

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Kembali
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="title text-2xl">Token akses</h1>
        <p className="mt-1 text-sm text-muted">
          Untuk mengirim nota dari iPhone lewat app Shortcuts (share sheet).
        </p>
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Buat token baru</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Label (opsional)" htmlFor="label">
                <input
                  id="label"
                  className={inputBase}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="mis. iPhone Budi"
                />
              </Field>
            </div>
            <button
              onClick={generate}
              disabled={busy}
              className="btn-primary disabled:opacity-50"
            >
              {busy ? 'Membuat…' : 'Buat token'}
            </button>
          </div>

          {fresh && (
            <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                Salin sekarang — hanya ditampilkan sekali
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-md border border-line bg-surface px-3 py-2 text-xs text-ink">
                  {fresh}
                </code>
                <button
                  onClick={() => copy(fresh, 'fresh')}
                  className="btn-ghost shrink-0 px-3 py-2 text-xs"
                >
                  {copied === 'fresh' ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Token aktif</h2>
          {loading ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-md border border-line bg-surface2" />
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Belum ada token.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.label || 'Tanpa label'}</p>
                    <p className="mt-0.5 text-xs text-muted">Dibuat {formatDate(t.created_at)}</p>
                  </div>
                  <button
                    onClick={() => revoke(t.id)}
                    className="btn-danger shrink-0 text-xs"
                  >
                    Cabut
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-ink">Cara pakai di iPhone (Shortcuts)</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ink">
            {shortcutSteps.map((s, i) => (
              <li key={i} className={s.label.startsWith('Authorization') || s.label.startsWith('apikey') || s.label.startsWith('URL:') ? 'font-mono text-xs' : ''}>
                {s.label}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted">
            Token = kredensial. Jangan dibagikan. Jika bocor, cabut lalu buat baru.
          </p>
        </div>
      </div>
    </Layout>
  );
}

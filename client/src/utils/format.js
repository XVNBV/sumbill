export function formatIDR(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(n));
  } catch {
    return String(n);
  }
}

export function formatDate(s) {
  if (!s) return '—';
  const iso = String(s).length === 10 ? `${s}T00:00:00` : s;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const TIPE_LABEL = { online: 'Online', offline: 'Offline' };

export const STATUS_LABEL = { verified: 'Terverifikasi', pending: 'Perlu verifikasi' };

export const STATUS_BADGE = {
  verified: 'text-neon border-neon/40 bg-neon/10',
  pending: 'text-volt border-volt/40 bg-volt/10',
};

export const TIPE_BADGE = {
  online: 'text-mag border-mag/40 bg-mag/10',
  offline: 'text-dim border-edge bg-panel',
};
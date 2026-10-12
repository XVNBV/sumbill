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

export const STATUS_LABEL = { verified: 'Terverifikasi', pending: 'Perlu verifikasi' };

export const STATUS_BADGE = {
  verified: 'text-primary border-primary/40 bg-primary/10',
  pending: 'text-warning border-warning/40 bg-warning/10',
};
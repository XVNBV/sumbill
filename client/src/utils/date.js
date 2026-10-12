const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayLocal() {
  return toISODate(new Date());
}

export function startOfMonth(d = new Date()) {
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(d = new Date()) {
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function monthLabel(d = new Date()) {
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

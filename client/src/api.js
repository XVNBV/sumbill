const API = '/api';

export function getToken() {
  return localStorage.getItem('sumbill_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('sumbill_token', token);
  else localStorage.removeItem('sumbill_token');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('sumbill_user') || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('sumbill_user', JSON.stringify(user));
  else localStorage.removeItem('sumbill_user');
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const h = { ...headers };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;

  const opts = { method, headers: h };
  if (body instanceof FormData) {
    opts.body = body;
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Terjadi kesalahan pada server');
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function downloadExport(query = '') {
  const token = getToken();
  const res = await fetch(API + `/stats/export.csv${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Gagal mengunduh file');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sumbill-export.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
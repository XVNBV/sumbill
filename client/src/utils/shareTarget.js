// Helper untuk menerima nota yang di-share dari aplikasi lain (Android/Chromium).
// File disimpan sementara oleh service worker di Cache Storage.

const SHARE_CACHE = 'sum-bill-share';
const SHARE_KEY = '/pending-share';

export async function getPendingShareFile() {
  if (typeof caches === 'undefined') return null;

  let cache;
  try {
    cache = await caches.open(SHARE_CACHE);
  } catch {
    return null;
  }

  const cached = await cache.match(SHARE_KEY);
  if (!cached) return null;

  try {
    const blob = await cached.blob();
    const rawName = cached.headers.get('X-File-Name');
    const name = rawName ? decodeURIComponent(rawName) : `nota-share-${Date.now()}.jpg`;
    const type = cached.headers.get('Content-Type') || blob.type || 'image/jpeg';
    return new File([blob], name, { type });
  } finally {
    await cache.delete(SHARE_KEY);
  }
}

export function clearShareParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has('share-target')) return;
  url.searchParams.delete('share-target');
  const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + url.hash;
  window.history.replaceState({}, '', next);
}

// SumBill service worker.
// Tugas utama: menangkap share foto dari aplikasi lain (Web Share Target API),
// menyimpannya sementara di Cache Storage, lalu mengarahkan app untuk mengambilnya.
// Selain itu memberi fallback offline ringan untuk navigasi.

const SHARE_CACHE = 'sum-bill-share';
const SHARE_KEY = '/pending-share';
const SHARE_MARKER = '/?share-target=1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open('sum-bill-shell')
      .then((cache) => cache.addAll(['/', '/index.html']).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHARE_CACHE, 'sum-bill-shell']);
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (keep.has(k) ? undefined : caches.delete(k))));
      await self.clients.claim();
    })(),
  );
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const files = formData.getAll('foto');
  const file = files.find((f) => f && typeof f === 'object' && 'arrayBuffer' in f);

  if (file) {
    const cache = await caches.open(SHARE_CACHE);
    await cache.put(
      SHARE_KEY,
      new Response(file, {
        headers: {
          'Content-Type': file.type || 'image/jpeg',
          'X-File-Name': encodeURIComponent(file.name || 'nota.jpg'),
        },
      }),
    );
  }

  // 303 wajib supaya refresh tidak mengirim ulang POST.
  return Response.redirect(SHARE_MARKER, 303);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(handleShareTarget(request));
    return;
  }

  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open('sum-bill-shell');
          return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error();
        }
      })(),
    );
  }
});

export function registerServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registrasi gagal (mis. bukan HTTPS). Fitur share target tidak aktif,
      // aplikasi tetap berjalan normal.
    });
  });
}

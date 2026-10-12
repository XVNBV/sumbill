import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError('Kamera tidak tersedia. Periksa izin kamera di browser (HTTPS/localhost).');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setBusy(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `nota-kamera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onCapture(file);
    }, 'image/jpeg', 0.92);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/80 backdrop-blur">
      <div className="card mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden m-4">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="label">Kamera — ambil foto nota</span>
          <button
            onClick={onClose}
            className="text-sm text-muted hover:text-primary"
          >
            Tutup
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-black">
          {error ? (
            <div className="grid h-full place-items-center p-8 text-center">
              <div>
                <p className="text-sm text-danger">{error}</p>
                <button onClick={onClose} className="btn-ghost mt-4 text-xs">
                  Kembali
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-contain"
              />
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="h-64 w-64 rounded-xl border-2 border-dashed border-primary/50" />
              </div>
              <span className="pointer-events-none absolute left-3 top-3 animate-pulse-soft rounded-full bg-primary/10 px-2 py-0.5  text-xs text-primary">
                REC
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-line px-4 py-4">
          {!error && (
            <button
              onClick={capture}
              disabled={busy}
              className="btn-primary rounded-full px-6 font-display tracking-[0.14em] disabled:opacity-50"
            >
              {busy ? 'MENYIMPAN…' : 'AMBIL'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
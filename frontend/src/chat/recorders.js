// Ovozli xabar va dumaloq video-xabar yozish (MediaRecorder). Ruxsat faqat
// tugma bosilganda so'raladi. Format: brauzer qo'llaganidan birinchisi.
const AUDIO_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const VIDEO_TYPES = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];

const pickType = (list) =>
  typeof MediaRecorder !== 'undefined' ? list.find((t) => MediaRecorder.isTypeSupported?.(t)) || '' : '';

export function mediaError(err, what = 'mikrofon') {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'Yozib olish faqat HTTPS orqali ishlaydi.';
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return 'Brauzeringiz yozib olishni qo\'llab-quvvatlamaydi.';
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return `${what === 'kamera' ? 'Kamera va mikrofon' : 'Mikrofon'}ga ruxsat berilmagan. Brauzer manzil satridagi qulf belgisidan ruxsat bering.`;
    case 'NotFoundError':
    case 'OverconstrainedError':
      return `${what === 'kamera' ? 'Kamera' : 'Mikrofon'} topilmadi.`;
    case 'NotReadableError':
      return `${what === 'kamera' ? 'Kamera' : 'Mikrofon'} boshqa dastur tomonidan band.`;
    default:
      return 'Yozib olishni boshlab bo\'lmadi.';
  }
}

const extFor = (mime) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm');

// Ovoz: onLevel(0..1) jonli to'lqin uchun; stop() -> { blob, duration, waveform, mime, name }.
export async function startVoice({ maxSeconds, onLevel, onTick, onAutoStop }) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mimeType = pickType(AUDIO_TYPES);
  const rec = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 48000 } : undefined);
  const chunks = [];
  const levels = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  const buf = new Uint8Array(analyser.fftSize);
  const started = Date.now();
  let raf = 0;
  let stopped = false;

  const loop = () => {
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 1) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const level = Math.min(1, Math.sqrt(sum / buf.length) * 3);
    levels.push(level);
    onLevel?.(level);
    const sec = (Date.now() - started) / 1000;
    onTick?.(sec);
    if (sec >= maxSeconds) {
      onAutoStop?.();
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  rec.start(250);
  raf = requestAnimationFrame(loop);

  const cleanup = () => {
    cancelAnimationFrame(raf);
    stream.getTracks().forEach((t) => t.stop());
    ctx.close().catch(() => {});
  };

  return {
    stop: () =>
      new Promise((resolve) => {
        if (stopped) return;
        stopped = true;
        rec.onstop = () => {
          cleanup();
          const duration = Math.min((Date.now() - started) / 1000, maxSeconds);
          const type = rec.mimeType || mimeType || 'audio/webm';
          const blob = new Blob(chunks, { type });
          resolve({ blob, duration, waveform: downsample(levels, 48), mime: type, name: `ovozli-xabar.${extFor(type)}` });
        };
        rec.stop();
      }),
    cancel: () => {
      if (stopped) return;
      stopped = true;
      rec.onstop = cleanup;
      rec.stop();
    },
  };
}

function downsample(levels, n) {
  if (!levels.length) return Array(n).fill(0.05);
  const out = [];
  const step = levels.length / n;
  for (let i = 0; i < n; i += 1) {
    const slice = levels.slice(Math.floor(i * step), Math.max(Math.floor((i + 1) * step), Math.floor(i * step) + 1));
    out.push(Math.max(...slice));
  }
  const peak = Math.max(...out, 0.01);
  return out.map((v) => Math.round(Math.max(0.05, v / peak) * 100) / 100);
}

// Dumaloq video-xabar: kvadrat oldi kamera. Qaytaradi { stream, stop, cancel }.
export async function startVideoNote({ maxSeconds, onTick, onAutoStop }) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 }, aspectRatio: 1 },
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  const mimeType = pickType(VIDEO_TYPES);
  const rec = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 1_000_000 } : undefined);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const started = Date.now();
  let stopped = false;
  const timer = setInterval(() => {
    const sec = (Date.now() - started) / 1000;
    onTick?.(sec);
    if (sec >= maxSeconds) onAutoStop?.();
  }, 200);
  rec.start(500);

  const cleanup = () => {
    clearInterval(timer);
    stream.getTracks().forEach((t) => t.stop());
  };
  return {
    stream,
    stop: () =>
      new Promise((resolve) => {
        if (stopped) return;
        stopped = true;
        rec.onstop = () => {
          cleanup();
          const type = rec.mimeType || mimeType || 'video/webm';
          resolve({
            blob: new Blob(chunks, { type }),
            duration: Math.min((Date.now() - started) / 1000, maxSeconds),
            mime: type,
            name: `video-xabar.${type.includes('mp4') ? 'mp4' : 'webm'}`,
          });
        };
        rec.stop();
      }),
    cancel: () => {
      if (stopped) return;
      stopped = true;
      rec.onstop = cleanup;
      rec.stop();
    },
  };
}

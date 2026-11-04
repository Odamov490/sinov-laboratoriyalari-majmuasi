import { tr } from '../i18n/tr.js';
// Klient tomonida media tayyorlash (serverda ffmpeg/sharp yo'q):
//  - rasm: eng uzun tomoni 1920 px, JPEG/WebP ~0.85; GIF siqilmaydi;
//    shaffof PNG shaffofligi saqlanadi (WebP yoki asl PNG);
//  - thumbnail: canvas orqali ~320 px JPEG;
//  - video: o'lcham, davomiylik va birinchi kadrdan poster.
const MAX_SIDE = 1920;
const QUALITY = 0.85;
const THUMB_SIDE = 320;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(tr("Rasmni o'qib bo'lmadi")));
    };
    img.src = url;
  });

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

function fit(w, h, max) {
  const k = Math.min(1, max / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

function hasAlpha(ctx, w, h) {
  const step = Math.max(1, Math.floor((w * h) / 40000));
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < data.length; i += 4 * step) if (data[i] < 255) return true;
  return false;
}

const renameExt = (name, ext) => `${(name || 'rasm').replace(/\.[^.]+$/, '')}.${ext}`;

// Qaytaradi: { file, width, height, thumb }
export async function prepareImage(file) {
  const { img, url } = await loadImage(file);
  try {
    const w0 = img.naturalWidth;
    const h0 = img.naturalHeight;
    const thumb = await drawThumb(img, w0, h0);
    if (file.type === 'image/gif') return { file, width: w0, height: h0, thumb };

    const [w, h] = fit(w0, h0, MAX_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    let out = null;
    if (file.type === 'image/png' && hasAlpha(ctx, w, h)) {
      const webp = await toBlob(canvas, 'image/webp', QUALITY);
      if (webp && webp.type === 'image/webp') out = new File([webp], renameExt(file.name, 'webp'), { type: 'image/webp' });
      else if (w === w0) return { file, width: w0, height: h0, thumb };
      else {
        const png = await toBlob(canvas, 'image/png');
        out = new File([png], renameExt(file.name, 'png'), { type: 'image/png' });
      }
    } else {
      const jpg = await toBlob(canvas, 'image/jpeg', QUALITY);
      out = new File([jpg], renameExt(file.name, 'jpg'), { type: 'image/jpeg' });
    }
    // Siqish foyda bermasa (kichik rasm) — asl fayl.
    if (out.size >= file.size && w === w0) return { file, width: w0, height: h0, thumb };
    return { file: out, width: w, height: h, thumb };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function drawThumb(source, w0, h0) {
  const [w, h] = fit(w0, h0, THUMB_SIDE);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(source, 0, 0, w, h);
  return toBlob(canvas, 'image/jpeg', 0.75);
}

// Video: { width, height, duration, thumb }. O'qib bo'lmasa — bo'sh meta.
export function prepareVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    let done = false;
    const finish = (meta) => {
      if (done) return;
      done = true;
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    const timer = setTimeout(() => finish({}), 8000);
    video.onloadedmetadata = () => {
      // Ba'zi WebM fayllarda davomiylik Infinity — o'tkazib yuboramiz.
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
    };
    video.onseeked = async () => {
      clearTimeout(timer);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = Number.isFinite(video.duration) ? video.duration : undefined;
      let thumb = null;
      try {
        if (width && height) thumb = await drawThumb(video, width, height);
      } catch {
        thumb = null;
      }
      finish({ width, height, duration, thumb });
    };
    video.onerror = () => {
      clearTimeout(timer);
      finish({});
    };
    video.src = url;
  });
}

// Yozib olingan video-xabardan birinchi kadr.
export async function videoThumbFromBlob(blob) {
  const meta = await prepareVideo(new File([blob], 'note.webm', { type: blob.type }));
  return meta.thumb || null;
}

export const kindOf = (file) => {
  if (/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return 'IMAGE';
  if (/^video\/(mp4|webm|quicktime)$/.test(file.type)) return 'VIDEO';
  return 'FILE';
};

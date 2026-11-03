const fs = require('fs');

// Chat fayllari: kengaytma + magic-bytes bo'yicha aniqlash. Kengaytma faqat
// aniqlangan turga mos bo'lsa qabul qilinadi; bajariladigan fayllar rad.
const BLOCKED_EXT = new Set([
  'exe', 'dll', 'com', 'scr', 'msi', 'msp', 'bat', 'cmd', 'ps1', 'psm1', 'vbs', 'vbe', 'js', 'mjs', 'jse', 'wsf', 'wsh',
  'sh', 'bash', 'zsh', 'py', 'pl', 'rb', 'php', 'jar', 'apk', 'app', 'dmg', 'deb', 'rpm', 'bin', 'elf', 'so', 'dylib',
  'lnk', 'reg', 'hta', 'cpl', 'gadget', 'html', 'htm', 'xhtml', 'svg', 'xml', 'iso', 'img', 'vhd', 'docm', 'xlsm', 'pptm',
]);

const TYPES = {
  jpeg: { kind: 'IMAGE', mime: 'image/jpeg', ext: ['jpg', 'jpeg'] },
  png: { kind: 'IMAGE', mime: 'image/png', ext: ['png'] },
  gif: { kind: 'IMAGE', mime: 'image/gif', ext: ['gif'] },
  webp: { kind: 'IMAGE', mime: 'image/webp', ext: ['webp'] },
  mp4: { kind: 'VIDEO', mime: 'video/mp4', ext: ['mp4', 'm4v'] },
  mov: { kind: 'VIDEO', mime: 'video/quicktime', ext: ['mov'] },
  webmVideo: { kind: 'VIDEO', mime: 'video/webm', ext: ['webm'] },
  webmAudio: { kind: 'AUDIO', mime: 'audio/webm', ext: ['webm', 'weba'] },
  m4a: { kind: 'AUDIO', mime: 'audio/mp4', ext: ['m4a', 'mp4', 'aac'] },
  ogg: { kind: 'AUDIO', mime: 'audio/ogg', ext: ['ogg', 'oga', 'opus'] },
  mp3: { kind: 'AUDIO', mime: 'audio/mpeg', ext: ['mp3'] },
  wav: { kind: 'AUDIO', mime: 'audio/wav', ext: ['wav'] },
  pdf: { kind: 'FILE', mime: 'application/pdf', ext: ['pdf'] },
  docx: { kind: 'FILE', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: ['docx'] },
  xlsx: { kind: 'FILE', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: ['xlsx'] },
  pptx: { kind: 'FILE', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: ['pptx'] },
  zip: { kind: 'FILE', mime: 'application/zip', ext: ['zip'] },
  txt: { kind: 'FILE', mime: 'text/plain; charset=utf-8', ext: ['txt'] },
  csv: { kind: 'FILE', mime: 'text/csv; charset=utf-8', ext: ['csv'] },
};

const extOf = (name) => {
  const m = /\.([A-Za-z0-9]{1,8})$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
};

async function readSlices(file) {
  const fh = await fs.promises.open(file, 'r');
  try {
    const { size } = await fh.stat();
    const head = Buffer.alloc(Math.min(8192, size));
    await fh.read(head, 0, head.length, 0);
    const tailLen = Math.min(65536, size);
    const tail = Buffer.alloc(tailLen);
    await fh.read(tail, 0, tailLen, size - tailLen);
    return { head, tail, size };
  } finally {
    await fh.close();
  }
}

const starts = (buf, bytes, offset = 0) => bytes.every((b, i) => buf[offset + i] === b);
const ascii = (buf, from, to) => buf.slice(from, to).toString('latin1');

// purpose: 'voice' | 'video_note' | undefined. Qaytaradi: TYPES elementi yoki null.
async function detect(file, originalName, purpose) {
  const ext = extOf(originalName);
  if (BLOCKED_EXT.has(ext)) return null;
  const { head, tail } = await readSlices(file);
  if (head.length < 4) return null;
  // Windows/Linux bajariladigan fayllar va skriptlar.
  if (starts(head, [0x4d, 0x5a]) || starts(head, [0x7f, 0x45, 0x4c, 0x46]) || starts(head, [0x23, 0x21])) return null;

  let type = null;
  if (starts(head, [0xff, 0xd8, 0xff])) type = 'jpeg';
  else if (starts(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) type = 'png';
  else if (ascii(head, 0, 6) === 'GIF87a' || ascii(head, 0, 6) === 'GIF89a') type = 'gif';
  else if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') type = 'webp';
  else if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WAVE') type = 'wav';
  else if (ascii(head, 0, 4) === 'OggS') type = 'ogg';
  else if (ascii(head, 0, 3) === 'ID3' || (head[0] === 0xff && (head[1] & 0xe0) === 0xe0 && ext === 'mp3')) type = 'mp3';
  else if (starts(head, [0x1a, 0x45, 0xdf, 0xa3])) {
    if (!head.includes(Buffer.from('webm'))) return null;
    const audioOnly = purpose === 'voice' || (purpose !== 'video_note' && ['weba'].includes(ext));
    type = audioOnly ? 'webmAudio' : 'webmVideo';
  } else if (ascii(head, 4, 8) === 'ftyp') {
    const brand = ascii(head, 8, 12);
    if (brand === 'qt  ') type = 'mov';
    else if (purpose === 'voice' || brand.startsWith('M4A') || ['m4a', 'aac'].includes(ext)) type = 'm4a';
    else type = 'mp4';
  } else if (ascii(head, 0, 5) === '%PDF-') type = 'pdf';
  else if (starts(head, [0x50, 0x4b, 0x03, 0x04])) {
    // OOXML: markaziy katalogdagi nomlar faylning oxirida.
    const names = ascii(tail, 0, tail.length);
    if (ext === 'docx' && names.includes('word/')) type = 'docx';
    else if (ext === 'xlsx' && names.includes('xl/')) type = 'xlsx';
    else if (ext === 'pptx' && names.includes('ppt/')) type = 'pptx';
    else if (ext === 'zip') type = 'zip';
    else return null;
  } else if (['txt', 'csv'].includes(ext)) {
    if (head.includes(0)) return null;
    type = ext;
  }
  if (!type) return null;

  const t = TYPES[type];
  // Kengaytma aniqlangan turga mos bo'lishi shart (ovozli xabar nomi klientda beriladi).
  if (!t.ext.includes(ext) && !purpose) return null;
  if (purpose === 'voice' && t.kind !== 'AUDIO') return null;
  if (purpose === 'video_note' && t.kind !== 'VIDEO') return null;
  return { type, ...t };
}

// Kichik rasm (thumbnail): faqat JPEG/PNG/WebP.
async function detectThumb(file) {
  const { head } = await readSlices(file);
  if (starts(head, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts(head, [0x89, 0x50, 0x4e, 0x47])) return 'image/png';
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

module.exports = { detect, detectThumb, extOf, TYPES };

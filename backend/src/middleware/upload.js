const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { UPLOAD_DIR, MAX_FILE_SIZE_MB } = require('../config/env');

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

// Minimal magic-byte signatures to reduce risk of disguised executables.
const SIGNATURES = [
  { ext: '.pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { ext: '.png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { ext: '.jpg', bytes: [0xff, 0xd8, 0xff] },
  { ext: '.jpeg', bytes: [0xff, 0xd8, 0xff] },
  { ext: '.webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
];

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

const absoluteUploadDir = path.resolve(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(absoluteUploadDir)) {
  fs.mkdirSync(absoluteUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, absoluteUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomUUID();
    cb(null, `${unique}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Ruxsat etilmagan fayl turi.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 5 },
});

// Verify magic bytes after upload; caller should invoke and delete file if invalid.
function verifyFileSignature(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const expected = SIGNATURES.find((s) => s.ext === ext);
  if (!expected) return false;
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(expected.bytes.length);
  fs.readSync(fd, buffer, 0, expected.bytes.length, 0);
  fs.closeSync(fd);
  return expected.bytes.every((byte, i) => buffer[i] === byte);
}

module.exports = { upload, verifyFileSignature, sanitizeFilename, absoluteUploadDir };

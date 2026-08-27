function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Sahifa topilmadi.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ushbu qiymat allaqachon mavjud (unique constraint).' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Yozuv topilmadi.' });
  }
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validatsiya xatosi.', details: err.errors });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Fayl yuklash xatosi: ${err.message}` });
  }
  const status = err.status || 500;
  res.status(status).json({ error: status === 500 ? 'Serverda xatolik yuz berdi.' : err.message });
}

module.exports = { asyncHandler, notFoundHandler, errorHandler };

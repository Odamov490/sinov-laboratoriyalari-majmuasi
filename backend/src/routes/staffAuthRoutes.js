const express = require('express');
const fs = require('fs');
const { login, logout, refresh, me, updateMe, myActivity } = require('../controllers/staffAuthController');
const { authenticateStaff } = require('../middleware/auth');
const { staffAuthLimiter } = require('../middleware/rateLimit');
const { upload, verifyFileSignature } = require('../middleware/upload');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.post('/login', staffAuthLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticateStaff, me);
router.put('/me', authenticateStaff, updateMe);
router.get('/me/activity', authenticateStaff, myActivity);

router.post(
  '/me/photo',
  authenticateStaff,
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Fayl topilmadi.' });
    if (!verifyFileSignature(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Fayl formati yaroqsiz.' });
    }
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  })
);

module.exports = router;

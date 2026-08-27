const express = require('express');
const { login, logout, me, refresh } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);

module.exports = router;

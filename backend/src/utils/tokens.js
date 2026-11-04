const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = require('../config/env');

// sid — sessiya (faol qurilma) identifikatori.
function signAccessToken(user, sid) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, fullName: user.fullName, ...(sid && { sid }) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signRefreshToken(user, sid) {
  return jwt.sign({ sub: user.id, type: 'refresh', sid }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

module.exports = { signAccessToken, signRefreshToken, verifyToken, cookieOptions };

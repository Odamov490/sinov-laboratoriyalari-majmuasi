const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id, type: 'refresh' }, JWT_SECRET, {
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

// Staff cabinet tokens use their own claim shape (role: 'STAFF', distinct
// `type` values) and distinct cookie names below, so a staff session and an
// admin session can coexist in the same browser without colliding.
function signStaffAccessToken(staff) {
  return jwt.sign(
    { sub: staff.id, role: 'STAFF', fullName: staff.fullName, type: 'staff-access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function signStaffRefreshToken(staff) {
  return jwt.sign({ sub: staff.id, role: 'STAFF', type: 'staff-refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  cookieOptions,
  signStaffAccessToken,
  signStaffRefreshToken,
};

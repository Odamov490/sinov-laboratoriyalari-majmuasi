const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

function authenticate(req, res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.accessToken || bearer;

  if (!token) {
    return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan.' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi.' });
    }
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Verifies a staff-cabinet access token (distinct cookie/claims from the
// admin `authenticate` above) and attaches it as `req.staff`.
function authenticateStaff(req, res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.staffAccessToken || bearer;

  if (!token) {
    return res.status(401).json({ error: 'Autentifikatsiya talab qilinadi.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'STAFF' || payload.type !== 'staff-access') {
      return res.status(401).json({ error: 'Token yaroqsiz.' });
    }
    req.staff = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan.' });
  }
}

module.exports = { authenticate, authorize, authenticateStaff };

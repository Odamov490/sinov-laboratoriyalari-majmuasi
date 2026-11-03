const crypto = require('crypto');
const { z } = require('zod');
const { LOGIN_EMAIL_DOMAIN } = require('../config/env');

// Login = User.email. A bare name ("axror") gets "@<LOGIN_EMAIL_DOMAIN>";
// anything with "@" is used as typed, so existing real emails keep working.
function normalizeLogin(input) {
  const value = String(input || '').trim().toLowerCase();
  if (!value) return '';
  return value.includes('@') ? value : `${value}@${LOGIN_EMAIL_DOMAIN}`;
}

const LOGIN_RE = /^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const isValidLogin = (email) => LOGIN_RE.test(email);

// Password policy for user-chosen passwords: at least 10 characters with at
// least one letter and one digit.
const passwordSchema = z
  .string()
  .min(10, "Parol kamida 10 belgidan iborat bo'lishi kerak.")
  .max(128, 'Parol juda uzun.')
  .refine((p) => /\p{L}/u.test(p), "Parolda kamida bitta harf bo'lishi kerak.")
  .refine((p) => /\d/.test(p), "Parolda kamida bitta raqam bo'lishi kerak.");

// No look-alike characters (0/O, 1/l/I).
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const ALPHABET = UPPER + LOWER + DIGITS;

// Temporary password: 12 random characters in groups of four
// ("Kx7m-Qp3w-Rt9z"), always with an upper, a lower letter and a digit.
function generatePassword() {
  for (;;) {
    const chars = Array.from({ length: 12 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]);
    const s = chars.join('');
    if (/[A-Z]/.test(s) && /[a-z]/.test(s) && /\d/.test(s)) {
      return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
    }
  }
}

// A user's laboratory: their own labId, else the linked specialist card's.
const effectiveLabId = (user) => user?.labId || user?.staff?.laboratoryId || null;

module.exports = { normalizeLogin, isValidLogin, passwordSchema, generatePassword, effectiveLabId };

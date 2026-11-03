// Chat xatolari: status + foydalanuvchiga ko'rinadigan o'zbekcha matn.
// A'zo bo'lmagan foydalanuvchi uchun har doim 404 (xona borligi ham oshkor
// qilinmaydi).
class ChatError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const notFound = (what = 'Topilmadi.') => new ChatError(404, what, 'NOT_FOUND');
const forbidden = (msg = "Bu amal uchun ruxsat yo'q.") => new ChatError(403, msg, 'FORBIDDEN');
const badRequest = (msg) => new ChatError(400, msg, 'BAD_REQUEST');
const tooMany = (msg = "Juda tez. Birozdan so'ng qayta urinib ko'ring.") => new ChatError(429, msg, 'RATE_LIMIT');

module.exports = { ChatError, notFound, forbidden, badRequest, tooMany };

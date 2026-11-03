// Chat hodisalari shinasi. Servislar (REST va socket bir xil) shu yerga
// hodisa chiqaradi; socket qatlami (2-bosqich) ularni xonalarga tarqatadi.
// Hodisalar:
//   message:new      { roomId, message }
//   message:updated  { roomId, message }
//   message:deleted  { roomId, messageId, forUserId? }
//   reaction:updated { roomId, messageId, reactions }
//   room:updated     { roomId, userIds? }   — xona ma'lumoti/a'zolari o'zgardi
//   room:read-by     { roomId, userId, messageId, readAt }
//   membership:changed { userId }           — foydalanuvchi xonalari o'zgardi
//   user:disabled    { userId }             — nofaol yoki chat o'chirildi
const { EventEmitter } = require('events');

const chatEvents = new EventEmitter();
chatEvents.setMaxListeners(50);

module.exports = { chatEvents };

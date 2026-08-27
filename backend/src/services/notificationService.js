/**
 * Notification service abstraction.
 *
 * This module defines a provider-agnostic interface for sending
 * notifications (e.g. when an application's status changes). Concrete
 * providers (SMTP email, Telegram bot API) can be plugged in by
 * implementing `send(notification)` and registering below.
 *
 * By default a NoopProvider is used so the app runs without external
 * credentials configured. Wire up real providers via environment
 * variables in production.
 */

class NoopProvider {
  async send(notification) {
    console.log('[notification:noop]', notification);
    return { delivered: false, reason: 'No provider configured' };
  }
}

// Example shape for a future EmailProvider using SMTP (e.g. nodemailer):
// class EmailProvider {
//   constructor({ host, port, user, pass, from }) { ... }
//   async send({ to, subject, text }) { ... }
// }

// Example shape for a future TelegramProvider:
// class TelegramProvider {
//   constructor({ botToken, chatId }) { ... }
//   async send({ text }) { ... }
// }

const provider = new NoopProvider();

async function notifyApplicationStatusChange(application) {
  return provider.send({
    type: 'APPLICATION_STATUS_CHANGE',
    to: application.email || application.phone,
    subject: `Ariza holati yangilandi: ${application.applicationNumber}`,
    text: `Arizangiz (${application.applicationNumber}) holati: ${application.status}`,
  });
}

async function notifyNewApplication(application) {
  return provider.send({
    type: 'NEW_APPLICATION',
    subject: `Yangi ariza: ${application.applicationNumber}`,
    text: `Yangi ariza qabul qilindi: ${application.applicationNumber} - ${application.fullName}`,
  });
}

module.exports = { notifyApplicationStatusChange, notifyNewApplication };

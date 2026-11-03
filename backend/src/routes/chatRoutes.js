const express = require('express');
const rateLimit = require('express-rate-limit');
const chat = require('../controllers/chatController');

// /api/admin/chat — adminRoutes ichida (authenticate + requireActiveAccount +
// no-store + requireModule('chat') allaqachon o'tgan). IP bo'yicha umumiy
// limit bu yo'llarga qo'llanmaydi (app.js); o'rniga foydalanuvchi bo'yicha.
const router = express.Router();

router.use(chat.requireChatUser);
router.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 600,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `chat:${req.chatUser.id}`,
    message: { error: "Juda ko'p so'rov. Birozdan so'ng qayta urinib ko'ring." },
  })
);

router.get('/settings', chat.getLimits);
router.put('/settings', chat.updateSettings);
router.get('/unread', chat.unread);
router.get('/users', chat.directory);
router.get('/search', chat.search);
router.get('/admin/stats', chat.adminStats);

router.post('/uploads', chat.uploadMiddleware, chat.upload);
router.post('/media-urls', chat.mediaUrls);

router.get('/stickers', chat.listStickers);
router.post('/sticker-packs', chat.createPack);
router.put('/sticker-packs/:id', chat.updatePack);
router.delete('/sticker-packs/:id', chat.deletePack);
router.post('/sticker-packs/:id/stickers', chat.stickerUploadMiddleware, chat.addStickers);
router.put('/stickers/:id', chat.updateSticker);
router.delete('/stickers/:id', chat.deleteSticker);

router.get('/rooms', chat.listRooms);
router.post('/rooms', chat.createGroup);
router.post('/rooms/direct', chat.openDirect);
router.get('/rooms/:id', chat.getRoom);
router.put('/rooms/:id', chat.renameGroup);
router.post('/rooms/:id/members', chat.addMembers);
router.patch('/rooms/:id/members/:userId', chat.setMemberRole);
router.delete('/rooms/:id/members/:userId', chat.removeMember);
router.post('/rooms/:id/leave', chat.leaveRoom);
router.post('/rooms/:id/archive', chat.setArchived);
router.post('/rooms/:id/mute', chat.setMute);
router.post('/rooms/:id/read', chat.markRead);
router.get('/rooms/:id/pins', chat.listPins);
router.get('/rooms/:id/messages', chat.listMessages);
router.post('/rooms/:id/messages', chat.sendMessage);

router.put('/messages/:messageId', chat.editMessage);
router.delete('/messages/:messageId', chat.deleteMessage);
router.post('/messages/:messageId/reactions', chat.toggleReaction);
router.post('/messages/:messageId/pin', chat.pin);
router.delete('/messages/:messageId/pin', chat.unpin);
router.post('/messages/:messageId/forward', chat.forward);

router.use(chat.chatErrorHandler);

module.exports = router;

import apiClient from '../api/client';

// /api/admin/chat REST. Socket bo'lmaganda yuborish ham shu yerdan (idempotent).
const get = (url, params) => apiClient.get(`/admin/chat${url}`, { params }).then((r) => r.data);
const post = (url, body, config) => apiClient.post(`/admin/chat${url}`, body, config).then((r) => r.data);
const put = (url, body) => apiClient.put(`/admin/chat${url}`, body).then((r) => r.data);
const patch = (url, body) => apiClient.patch(`/admin/chat${url}`, body).then((r) => r.data);
const del = (url, params) => apiClient.delete(`/admin/chat${url}`, { params }).then((r) => r.data);

const chatApi = {
  settings: () => get('/settings'),
  updateSettings: (data) => put('/settings', data),
  unread: () => get('/unread'),
  users: (q) => get('/users', { q }),
  search: (params) => get('/search', params),
  stats: () => get('/admin/stats'),

  rooms: () => get('/rooms'),
  room: (id) => get(`/rooms/${id}`),
  openDirect: (userId) => post('/rooms/direct', { userId }),
  createGroup: (title, memberIds) => post('/rooms', { title, memberIds }),
  renameGroup: (id, title) => put(`/rooms/${id}`, { title }),
  addMembers: (id, userIds) => post(`/rooms/${id}/members`, { userIds }),
  setMemberRole: (id, userId, role) => patch(`/rooms/${id}/members/${userId}`, { role }),
  removeMember: (id, userId) => del(`/rooms/${id}/members/${userId}`),
  leave: (id) => post(`/rooms/${id}/leave`),
  archive: (id, archived) => post(`/rooms/${id}/archive`, { archived }),
  mute: (id, body) => post(`/rooms/${id}/mute`, body),
  read: (id, messageId) => post(`/rooms/${id}/read`, { messageId }),
  pins: (id) => get(`/rooms/${id}/pins`),
  messages: (id, params) => get(`/rooms/${id}/messages`, params),
  send: (id, payload) => post(`/rooms/${id}/messages`, payload),

  edit: (messageId, body) => put(`/messages/${messageId}`, { body }),
  remove: (messageId, scope) => del(`/messages/${messageId}`, { scope }),
  react: (messageId, emoji) => post(`/messages/${messageId}/reactions`, { emoji }),
  pin: (messageId) => post(`/messages/${messageId}/pin`),
  unpin: (messageId) => del(`/messages/${messageId}/pin`),
  forward: (messageId, roomIds) => post(`/messages/${messageId}/forward`, { roomIds }),

  mediaUrls: (ids) => post('/media-urls', { ids }),
  upload: (form, { onProgress, signal } = {}) =>
    post('/uploads', form, {
      signal,
      onUploadProgress: (e) => onProgress?.(e.total ? e.loaded / e.total : 0),
    }),

  stickers: (all) => get('/stickers', all ? { all: 1 } : undefined),
  createPack: (title) => post('/sticker-packs', { title }),
  updatePack: (id, data) => put(`/sticker-packs/${id}`, data),
  deletePack: (id) => del(`/sticker-packs/${id}`),
  addStickers: (id, form) => post(`/sticker-packs/${id}/stickers`, form),
  updateSticker: (id, data) => put(`/stickers/${id}`, data),
  deleteSticker: (id) => del(`/stickers/${id}`),
};

export const apiError = (err) => err?.response?.data?.error || err?.error || 'Xatolik yuz berdi.';

export default chatApi;

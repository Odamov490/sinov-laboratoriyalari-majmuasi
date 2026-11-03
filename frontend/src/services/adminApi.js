import apiClient, { setAccessToken } from '../api/client';

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password }).then((r) => {
    setAccessToken(r.data.accessToken);
    return r.data;
  });

export const logout = () => apiClient.post('/auth/logout').then(() => setAccessToken(null));
export const fetchMe = () => apiClient.get('/auth/me').then((r) => r.data);

// Generic admin CRUD resource client, mirrors backend crudFactory routes.
export function adminResource(path) {
  return {
    list: (params) => apiClient.get(`/admin/${path}`, { params }).then((r) => r.data),
    get: (id) => apiClient.get(`/admin/${path}/${id}`).then((r) => r.data),
    create: (data) => apiClient.post(`/admin/${path}`, data).then((r) => r.data),
    update: (id, data) => apiClient.put(`/admin/${path}/${id}`, data).then((r) => r.data),
    remove: (id) => apiClient.delete(`/admin/${path}/${id}`).then((r) => r.data),
  };
}

export const adminApplications = {
  list: (params) => apiClient.get('/admin/applications', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/admin/applications/${id}`).then((r) => r.data),
  updateStatus: (id, status, statusComment) =>
    apiClient.patch(`/admin/applications/${id}/status`, { status, statusComment }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/admin/applications/${id}`).then((r) => r.data),
};

export const adminPrices = {
  list: (params) => apiClient.get('/admin/prices', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/admin/prices', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/admin/prices/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/admin/prices/${id}`).then((r) => r.data),
};

export const adminUsers = adminResource('users');

// Hisobot: sinovlar jurnali (CRUD + umumiy hisobot).
export const adminTestJournal = {
  ...adminResource('test-journal'),
  summary: (params) => apiClient.get('/admin/test-journal/summary', { params }).then((r) => r.data),
  history: (id) => apiClient.get(`/admin/test-journal/${id}/history`).then((r) => r.data),
  suggestions: () => apiClient.get('/admin/test-journal/suggestions').then((r) => r.data),
  layout: () => apiClient.get('/admin/test-journal/layout').then((r) => r.data),
  saveLayout: (columns) => apiClient.put('/admin/test-journal/layout', { columns }).then((r) => r.data),
  importJournal: (data, { dryRun } = {}) =>
    apiClient.post('/admin/test-journal/import', data, { params: dryRun ? { dryRun: 1 } : {} }).then((r) => r.data),
};

export const updateSettings = (payload) => apiClient.put('/admin/settings', payload).then((r) => r.data);

export const adminInfoPage = {
  get: (slug) => apiClient.get(`/admin/info-pages/${slug}`).then((r) => r.data),
  update: (slug, payload) => apiClient.put(`/admin/info-pages/${slug}`, payload).then((r) => r.data),
};

export const getTopPages = (params) =>
  apiClient.get('/admin/analytics/top-pages', { params }).then((r) => r.data);

export const getAnalyticsOverview = (params) =>
  apiClient.get('/admin/analytics/overview', { params }).then((r) => r.data);

export const updateAdminProfile = (payload) => apiClient.put('/admin/profile', payload).then((r) => r.data);

export const getMyDashboard = () => apiClient.get('/admin/dashboard/my-activity').then((r) => r.data);

// Murojaat/ariza xulosasi (SUPER_ADMIN/MANAGER) — sarlavhadagi qo'ng'iroqcha uchun.
export const getInboxSummary = () => apiClient.get('/admin/inbox-summary').then((r) => r.data);

export const changePassword = (currentPassword, newPassword) =>
  apiClient.post('/auth/change-password', { currentPassword, newPassword }).then((r) => {
    setAccessToken(r.data.accessToken);
    return r.data;
  });

// Foydalanuvchilar: mutaxassislardan hisob yaratish va parolni tiklash.
export const adminAccounts = {
  staffWithoutAccount: () => apiClient.get('/admin/users/staff-without-account').then((r) => r.data),
  fromStaff: (payload) => apiClient.post('/admin/users/from-staff', payload).then((r) => r.data),
  resetPassword: (id) => apiClient.post(`/admin/users/${id}/reset-password`).then((r) => r.data),
};

// Vazifalar menejeri.
export const adminTasks = {
  list: (params) => apiClient.get('/admin/tasks', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/admin/tasks/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/admin/tasks', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/admin/tasks/${id}`, data).then((r) => r.data),
  setStatus: (id, status) => apiClient.patch(`/admin/tasks/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/admin/tasks/${id}`).then((r) => r.data),
  mySummary: () => apiClient.get('/admin/tasks/my-summary').then((r) => r.data),
  assignableUsers: () => apiClient.get('/admin/tasks/assignable-users').then((r) => r.data),
  addChecklistItem: (id, text) => apiClient.post(`/admin/tasks/${id}/checklist`, { text }).then((r) => r.data),
  updateChecklistItem: (id, itemId, data) => apiClient.patch(`/admin/tasks/${id}/checklist/${itemId}`, data).then((r) => r.data),
  removeChecklistItem: (id, itemId) => apiClient.delete(`/admin/tasks/${id}/checklist/${itemId}`).then((r) => r.data),
  addComment: (id, body) => apiClient.post(`/admin/tasks/${id}/comments`, { body }).then((r) => r.data),
  addAttachment: (id, data) => apiClient.post(`/admin/tasks/${id}/attachments`, data).then((r) => r.data),
  removeAttachment: (id, attId) => apiClient.delete(`/admin/tasks/${id}/attachments/${attId}`).then((r) => r.data),
};

// Shaxsiy bildirishnomalar (hamma rollar).
export const adminNotifications = {
  list: () => apiClient.get('/admin/notifications').then((r) => r.data),
  read: (id) => apiClient.post(`/admin/notifications/${id}/read`).then((r) => r.data),
  readAll: () => apiClient.post('/admin/notifications/read-all').then((r) => r.data),
};

export const uploadFiles = (files) => {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append('files', f));
  return apiClient
    .post('/admin/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

export const adminTestItems = {
  add: (applicationId, serviceId) =>
    apiClient.post(`/admin/applications/${applicationId}/test-items`, { serviceId }).then((r) => r.data),
  remove: (applicationId, itemId) =>
    apiClient.delete(`/admin/applications/${applicationId}/test-items/${itemId}`).then((r) => r.data),
};

export const adminTestIndicators = adminResource('test-indicators');
export const adminProducts = adminResource('products');

export const adminProductBuilder = {
  get: (productId) => apiClient.get(`/admin/products/${productId}/builder`).then((r) => r.data),
  addQuestion: (productId, data) =>
    apiClient.post(`/admin/products/${productId}/questions`, data).then((r) => r.data),
  updateQuestion: (productId, questionId, data) =>
    apiClient.put(`/admin/products/${productId}/questions/${questionId}`, data).then((r) => r.data),
  removeQuestion: (productId, questionId) =>
    apiClient.delete(`/admin/products/${productId}/questions/${questionId}`).then((r) => r.data),
  addOption: (productId, questionId, data) =>
    apiClient.post(`/admin/products/${productId}/questions/${questionId}/options`, data).then((r) => r.data),
  updateOption: (productId, questionId, optionId, data) =>
    apiClient
      .put(`/admin/products/${productId}/questions/${questionId}/options/${optionId}`, data)
      .then((r) => r.data),
  removeOption: (productId, questionId, optionId) =>
    apiClient
      .delete(`/admin/products/${productId}/questions/${questionId}/options/${optionId}`)
      .then((r) => r.data),
  listIndicators: (productId) => apiClient.get(`/admin/products/${productId}/indicators`).then((r) => r.data),
  addIndicator: (productId, data) =>
    apiClient.post(`/admin/products/${productId}/indicators`, data).then((r) => r.data),
  removeIndicator: (productId, assignmentId) =>
    apiClient.delete(`/admin/products/${productId}/indicators/${assignmentId}`).then((r) => r.data),
  reorderIndicators: (productId, assignmentIds) =>
    apiClient.post(`/admin/products/${productId}/indicators/reorder`, { assignmentIds }).then((r) => r.data),
};

export const adminSamples = {
  list: (params) => apiClient.get('/admin/samples', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/admin/samples', data).then((r) => r.data),
  getByCode: (code) => apiClient.get(`/admin/samples/code/${code}`).then((r) => r.data),
  get: (id) => apiClient.get(`/admin/samples/${id}`).then((r) => r.data),
  history: (id) => apiClient.get(`/admin/samples/${id}/history`).then((r) => r.data),
  action: (id, payload) => apiClient.post(`/admin/samples/${id}/action`, payload).then((r) => r.data),
  attach: (id, payload) => apiClient.post(`/admin/samples/${id}/attach`, payload).then((r) => r.data),
  stats: () => apiClient.get('/admin/samples/stats').then((r) => r.data),
};
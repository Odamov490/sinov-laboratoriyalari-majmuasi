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

export const updateSettings = (payload) => apiClient.put('/admin/settings', payload).then((r) => r.data);

export const adminInfoPage = {
  get: (slug) => apiClient.get(`/admin/info-pages/${slug}`).then((r) => r.data),
  update: (slug, payload) => apiClient.put(`/admin/info-pages/${slug}`, payload).then((r) => r.data),
};

export const getAnalyticsOverview = (params) =>
  apiClient.get('/admin/analytics/overview', { params }).then((r) => r.data);

export const updateAdminProfile = (payload) => apiClient.put('/admin/profile', payload).then((r) => r.data);

export const getMyDashboard = () => apiClient.get('/admin/dashboard/my-activity').then((r) => r.data);

export const getAdminNotifications = () => apiClient.get('/admin/notifications').then((r) => r.data);

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
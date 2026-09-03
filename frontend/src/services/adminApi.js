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
};

export const adminPrices = {
  list: (params) => apiClient.get('/admin/prices', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/admin/prices', data).then((r) => r.data),
  update: (id, data) => apiClient.put(`/admin/prices/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/admin/prices/${id}`).then((r) => r.data),
};

export const adminUsers = adminResource('users');

export const updateSettings = (payload) => apiClient.put('/admin/settings', payload).then((r) => r.data);

export const uploadFiles = (files) => {
  const formData = new FormData();
  Array.from(files).forEach((f) => formData.append('files', f));
  return apiClient
    .post('/admin/uploads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

export const adminSamples = {
  list: (params) => apiClient.get('/admin/samples', { params }).then((r) => r.data),
  create: (data) => apiClient.post('/admin/samples', data).then((r) => r.data),
  getByCode: (code) => apiClient.get(`/admin/samples/code/${code}`).then((r) => r.data),
  history: (id) => apiClient.get(`/admin/samples/${id}/history`).then((r) => r.data),
  action: (id, payload) => apiClient.post(`/admin/samples/${id}/action`, payload).then((r) => r.data),
  stats: () => apiClient.get('/admin/samples/stats').then((r) => r.data),
};
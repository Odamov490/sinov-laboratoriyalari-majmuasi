import apiClient from '../api/client';

export const getLaboratories = () => apiClient.get('/laboratories').then((r) => r.data);
export const getLaboratory = (slug) => apiClient.get(`/laboratories/${slug}`).then((r) => r.data);

export const getServices = (params) => apiClient.get('/services', { params }).then((r) => r.data);
export const getService = (slug) => apiClient.get(`/services/${slug}`).then((r) => r.data);

export const getPrices = (params) => apiClient.get('/prices', { params }).then((r) => r.data);
export const getStandards = (params) => apiClient.get('/standards', { params }).then((r) => r.data);

export const getNews = (params) => apiClient.get('/news', { params }).then((r) => r.data);
export const getNewsItem = (slug) => apiClient.get(`/news/${slug}`).then((r) => r.data);

export const getDocuments = (params) => apiClient.get('/documents', { params }).then((r) => r.data);
export const getStaff = (params) => apiClient.get('/staff', { params }).then((r) => r.data);

export const getEquipmentList = (params) => apiClient.get('/equipment', { params }).then((r) => r.data);
export const getEquipmentItem = (slug) => apiClient.get(`/equipment/${slug}`).then((r) => r.data);

export const getGallery = (params) => apiClient.get('/gallery', { params }).then((r) => r.data);
export const getFaq = () => apiClient.get('/faq').then((r) => r.data);
export const getAccreditation = () => apiClient.get('/accreditation').then((r) => r.data);
export const getSettings = () => apiClient.get('/settings').then((r) => r.data);
export const globalSearch = (q) => apiClient.get('/search', { params: { q } }).then((r) => r.data);

export const submitApplication = (formData) =>
  apiClient
    .post('/applications', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);

export const trackApplication = (applicationNumber) =>
  apiClient.get(`/applications/track/${applicationNumber}`).then((r) => r.data);

export const trackApplicationsByPhone = (phone) =>
  apiClient.get('/applications/track-by-phone', { params: { phone } }).then((r) => r.data);

export const sendContactMessage = (payload) => apiClient.post('/contact', payload).then((r) => r.data);

export const submitTnVedInquiry = (payload) => apiClient.post('/tnved/inquiry', payload).then((r) => r.data);
export const checkTnVedRegulation = (code) => apiClient.get('/tnved-check', { params: { code } }).then((r) => r.data);

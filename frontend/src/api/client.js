import axios from 'axios';
import { trServer } from '../i18n/tr.js';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let accessToken = null;
// Token yangilanganini kuzatuvchilar (chat socket yangi token bilan qayta autentifikatsiya qiladi).
const tokenListeners = new Set();
export function setAccessToken(token) {
  accessToken = token;
  tokenListeners.forEach((fn) => {
    try {
      fn(token);
    } catch {
      // kuzatuvchi xatosi asosiy oqimni buzmasin
    }
  });
}
export const getAccessToken = () => accessToken;
export function onAccessToken(fn) {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

// Server xabarlari (o'zbekcha) joriy tilga: { error, message } maydonlari.
function translateBody(error) {
  const data = error?.response?.data;
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') data.error = trServer(data.error);
    if (typeof data.message === 'string') data.message = trServer(data.message);
  }
  return error;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    translateBody(error);
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => apiClient(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await apiClient.post('/auth/refresh');
        setAccessToken(data.accessToken);
        queue.forEach((p) => p.resolve());
        queue = [];
        return apiClient(original);
      } catch (refreshErr) {
        queue.forEach((p) => p.reject(refreshErr));
        queue = [];
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }
    throw error;
  }
);

export default apiClient;

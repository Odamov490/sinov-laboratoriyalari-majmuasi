import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
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

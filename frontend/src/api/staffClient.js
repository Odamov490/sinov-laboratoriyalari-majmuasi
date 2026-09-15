import axios from 'axios';

// Separate axios instance (and separate access-token variable) from the
// admin api/client.js, so a staff cabinet session and an admin session can
// coexist in the same browser without their tokens/interceptors colliding.
const staffApiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let accessToken = null;
export function setStaffAccessToken(token) {
  accessToken = token;
}

staffApiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

staffApiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/staff-auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then(() => staffApiClient(original));
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await staffApiClient.post('/staff-auth/refresh');
        setStaffAccessToken(data.accessToken);
        queue.forEach((p) => p.resolve());
        queue = [];
        return staffApiClient(original);
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

export default staffApiClient;

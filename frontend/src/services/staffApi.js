import staffApiClient, { setStaffAccessToken } from '../api/staffClient';

export const staffLogin = (passportSeries, passportNumber, pinfl) =>
  staffApiClient.post('/staff-auth/login', { passportSeries, passportNumber, pinfl }).then((r) => {
    setStaffAccessToken(r.data.accessToken);
    return r.data;
  });

export const staffLogout = () => staffApiClient.post('/staff-auth/logout').then(() => setStaffAccessToken(null));

export const fetchStaffMe = () => staffApiClient.get('/staff-auth/me').then((r) => r.data);

export const updateStaffMe = (payload) => staffApiClient.put('/staff-auth/me', payload).then((r) => r.data);

export const getStaffMyActivity = () => staffApiClient.get('/staff-auth/me/activity').then((r) => r.data);

export const uploadStaffPhoto = (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return staffApiClient
    .post('/staff-auth/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

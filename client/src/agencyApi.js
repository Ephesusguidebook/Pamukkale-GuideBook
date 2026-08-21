import axios from 'axios';

// A separate axios instance (and separate localStorage key) from the admin
// panel's api.js — an agency and an admin can be logged in on the same
// browser at the same time without either token clobbering the other, and
// a 401 on one portal never logs the other one out.
const agencyApi = axios.create({
  baseURL: '/api',
});

agencyApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('agency_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

agencyApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('agency_token');
    }
    return Promise.reject(err);
  }
);

export default agencyApi;

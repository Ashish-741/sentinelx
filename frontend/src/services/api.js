/**
 * SentinelX API Service Layer
 */
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sentinelx_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept refresh token calls or login calls
      if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        const { data } = await axios.post(`${baseUrl}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.token;
        
        localStorage.setItem('sentinelx_token', newToken);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        
        processQueue(null, newToken);
        
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('sentinelx_token');
        if (
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/signup')
        ) {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 403) {
      toast.error('Access denied. Insufficient permissions.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

/** Unwrap `{ success, data }` API responses */
export function unwrap(res) {
  return res.data?.data ?? res.data;
}

// Auth
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const changePassword = (data) => api.post('/auth/change-password', data);
export const generateApiKey = (name) => api.post('/auth/api-keys', { name });
export const revokeApiKey = (keyId) => api.delete(`/auth/api-keys/${keyId}`);

// Scanning
export const scanURL = (url) => api.post('/scan/url', { url });
export const scanEmail = (text) => api.post('/scan/email', { text });
export const scanBatch = (urls) => api.post('/scan/batch', { urls });
export const getScanHistory = (params) => api.get('/scan/history', { params });
export const getScanById = (id) => api.get(`/scan/${id}`);
export const deleteScan = (scanId) => api.delete(`/scan/${scanId}`);

// Threat intelligence
export const lookupThreatIP = (ip) => api.post('/threat/ip', { ip });
export const lookupThreatDomain = (domain) => api.post('/threat/domain', { domain });
export const getThreatFeed = () => api.get('/threat/feed');

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentScans = () => api.get('/dashboard/recent');
export const getThreatTrends = () => api.get('/dashboard/trend');

// Admin
export const getAllUsers = (params) => api.get('/admin/users', { params });
export const banUser = (userId) => api.patch(`/admin/users/${userId}/ban`);
export const getAdminAnalytics = () => api.get('/admin/analytics');
export const getSystemLogs = (params) => api.get('/admin/logs', { params });
export const getAPIUsage = () => api.get('/admin/api-usage');

export default api;

import axios from 'axios';
import { clearAuth, getToken } from '../utils/auth';

const baseURL = import.meta.env.VITE_API_URL || '/api';

// Create an axios instance with the backend API base URL
// This is convenient so we don't have to repeat the full URL in every API call
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to every request
 * Checks localStorage for token and includes it in Authorization header
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles API errors globally
 * - 401: Token expired/invalid → redirect to login
 * - 403: Forbidden (no permission) → show warning toast
 * - Other errors: pass through to caller
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401: Unauthorized (token expired or missing)
    if (error.response?.status === 401) {
      clearAuth();
      window.dispatchEvent(new Event('seatwatch:session-expired'));
    }

    // 403: Forbidden (user doesn't have permission)
    if (error.response?.status === 403) {
      const errorMsg = error.response?.data?.message || 
                       'You do not have permission to perform this action';
      
      // Try to show a toast notification if a global toast function exists
      if (window.showToast) {
        window.showToast(errorMsg, 'warning');
      } else {
        // Fallback: log to console if no toast system is available
        console.warn('Access denied:', errorMsg);
      }
    }

    return Promise.reject(error);
  }
);

const unwrap = (response) => response.data?.data ?? response.data;

// Auth API
export const authAPI = {
  login: async (email, password) => unwrap(await api.post('/auth/login', { email, password })),
  register: async (name, email, password) => unwrap(await api.post('/auth/register', { name, email, password })),
  me: async () => unwrap(await api.get('/auth/me')),
};

// Admin API
export const adminAPI = {
  getAllUsers: async () => unwrap(await api.get('/admin/users')),
  getAllLicenses: async () => unwrap(await api.get('/licenses')),
  getAuditLogs: async ({ page = 1, limit = 20, action } = {}) => {
    const params = { page, limit };
    if (action) {
      params.action = action;
    }
    return (await api.get('/admin/audit-logs', { params })).data;
  },
  getSystemHealth: async () => unwrap(await api.get('/admin/system-health')),
  getStats: async () => unwrap(await api.get('/admin/stats')),
  updateUserRole: async (userId, role) => unwrap(await api.patch(`/admin/users/${userId}/role`, { role })),
  deleteUser: async (userId) => unwrap(await api.delete(`/admin/users/${userId}`)),
};

export const statsAPI = {
  getHomeStats: async () => unwrap(await api.get('/stats/home')),
};

// License API
export const licenseAPI = {
  getAllLicenses: async () => unwrap(await api.get('/licenses')),
  getLicenses: async () => unwrap(await api.get('/licenses')),
  createLicense: async (employeeId, softwareId) => unwrap(await api.post('/licenses', { employee_id: employeeId, software_id: softwareId })),
  assignLicense: async (employeeId, softwareId) => unwrap(await api.post('/licenses', { employee_id: employeeId, software_id: softwareId })),
  updateLicense: async (id, data) => unwrap(await api.put(`/licenses/${id}`, data)),
  deleteLicense: async (id) => unwrap(await api.delete(`/licenses/${id}`)),
  revokeLicense: async (id) => unwrap(await api.post(`/licenses/${id}/prune`)),
  pruneLicense: async (id) => unwrap(await api.post(`/licenses/${id}/prune`)),
  reactivateLicense: async (id, lastActiveDate) => unwrap(await api.put(`/licenses/${id}`, { status: 'active', last_active_date: lastActiveDate })),
  getIdleLicenses: async () => unwrap(await api.get('/licenses/idle/list')),
};

export const apiErrorMessage = (error) => error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';

// Software API
export const softwareAPI = {
  getAllSoftware: async () => unwrap(await api.get('/software')),
  getSoftware: async () => unwrap(await api.get('/software')),
  createSoftware: async (name, category, price_per_seat) => unwrap(await api.post('/software', { name, category, price_per_seat })),
  updateSoftware: async (id, data) => unwrap(await api.put(`/software/${id}`, data)),
  deleteSoftware: async (id) => unwrap(await api.delete(`/software/${id}`)),
};

// Account API
export const userAPI = {
  getAllUsers: async () => unwrap(await api.get('/users')),
  getUsers: async () => unwrap(await api.get('/users')),
  getProfile: async () => unwrap(await api.get('/users/profile')),
  updateProfile: async (data) => unwrap(await api.put('/users/profile', data)),
  createAccount: async (name, email, password) => unwrap(await api.post('/users', { name, email, password })),
  updateUser: async (id, data) => unwrap(await api.put(`/users/${id}`, data)),
  deleteUser: async (id) => unwrap(await api.delete(`/users/${id}`)),
};

// Employee directory and license assignees have no login credentials.
export const employeeAPI = {
  getAll: async () => unwrap(await api.get('/employees')),
  create: async (name, email) => unwrap(await api.post('/employees', { name, email })),
  update: async (id, name, email) => unwrap(await api.put(`/employees/${id}`, { name, email })),
  remove: async (id) => unwrap(await api.delete(`/employees/${id}`)),
};

export const dashboardAPI = {
  getStats: async () => unwrap(await api.get('/dashboard/stats')),
  getDashboard: async () => unwrap(await api.get('/dashboard')),
  getSummary: async () => unwrap(await api.get('/dashboard/summary')),
};

// Export the api instance so other components can use it
export default api;

import axios from 'axios';
import { getToken } from '../utils/auth';

// Create an axios instance with the backend API base URL
// This is convenient so we don't have to repeat the full URL in every API call
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
      localStorage.removeItem('seatwatch_token');
      window.location.href = '/login';
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

// Export the api instance so other components can use it
export default api;

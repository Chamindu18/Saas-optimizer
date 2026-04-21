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
 * Response interceptor - handles token expiration
 * If 401 response, token is invalid/expired, redirect to login
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('seatwatch_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export the api instance so other components can use it
export default api;

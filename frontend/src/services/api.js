import axios from 'axios';

// Create an axios instance with the backend API base URL
// This is convenient so we don't have to repeat the full URL in every API call
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export the api instance so other components can use it
export default api;

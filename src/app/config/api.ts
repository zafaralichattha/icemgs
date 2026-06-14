import axios from 'axios';

// API Base URL - Default to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401: {
          // Unauthorized - clear token and redirect to login
          // But don't redirect during auth calls (login/register/password change) or profile updates
          const requestUrl = error.config?.url || '';
          const isAuthCall = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/registration') || requestUrl.includes('/auth/password/change') || requestUrl.includes('/users/update_profile');
          if (!isAuthCall) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
          break;
        }
        case 403:
          console.error('Permission denied:', data);
          break;
        case 404:
          console.error('Resource not found:', data);
          break;
        case 500:
          console.error('Server error:', data);
          break;
        default:
          console.error('API Error:', data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - server not responding');
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

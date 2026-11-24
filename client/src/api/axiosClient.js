import axios from 'axios';

// Base URL points to /api/v1 (proxied by Vite to http://localhost:5000 in dev)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Bearer Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors and handle 401
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      errors: error.response?.data?.errors || null,
    };

    // If 401 Unauthorized occurs on protected call, trigger logout if needed
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      localStorage.removeItem('hms_access_token');
      localStorage.removeItem('hms_user');
      // Dispatch custom event to notify React context without window.location reload
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(customError);
  }
);

export default axiosClient;

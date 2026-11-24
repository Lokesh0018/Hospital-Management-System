import axios from 'axios';

// Get base URL from environment or use relative path in production
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create an axios instance for notification-related requests
const notificationClient = axios.create({
  baseURL: `${API_URL}/notifications`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
notificationClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const notificationApi = {
  /**
   * Get all notifications for current user
   */
  getNotifications: async () => {
    const response = await notificationClient.get('/');
    return response.data; // { notifications: [], unreadCount: 0 }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await notificationClient.patch('/read-all');
    return response.data;
  },

  /**
   * Mark single notification as read
   */
  markAsRead: async (id) => {
    const response = await notificationClient.patch(`/${id}/read`);
    return response.data;
  },

  /**
   * Clear notifications (can pass ?onlyRead=true)
   */
  clearNotifications: async (onlyRead = false) => {
    const response = await notificationClient.delete('/', {
      params: { onlyRead }
    });
    return response.data;
  }
};

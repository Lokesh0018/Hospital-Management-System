import axiosClient from './axiosClient.js';

export const authApi = {
  /**
   * Login with email and password
   * @param {Object} credentials { email, password }
   */
  login: async (credentials) => {
    return await axiosClient.post('/auth/login', credentials);
  },

  /**
   * Logout user and revoke refresh token
   */
  logout: async () => {
    return await axiosClient.post('/auth/logout');
  },

  /**
   * Get current authenticated user profile
   */
  getMe: async () => {
    return await axiosClient.get('/auth/me');
  },

  /**
   * Refresh JWT access token
   */
  refreshToken: async (token) => {
    return await axiosClient.post('/auth/refresh-token', { refreshToken: token });
  },
};

export default authApi;

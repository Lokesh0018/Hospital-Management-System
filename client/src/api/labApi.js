import axiosClient from './axiosClient.js';

export const labApi = {
  /**
   * Get dashboard statistics for Lab Technician
   */
  getDashboardOverview: async () => {
    return await axiosClient.get('/lab/dashboard');
  }
};

export default labApi;

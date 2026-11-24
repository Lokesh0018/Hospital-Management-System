import axiosClient from './axiosClient.js';

export const adminApi = {
  /**
   * Get unified Admin Dashboard overview with all 15 metrics
   * @param {Object} params { limit, date }
   */
  getDashboardOverview: async (params = {}) => {
    return await axiosClient.get('/admin/dashboard', { params });
  },

  /**
   * Get core dashboard statistics (KPIs 1 - 10)
   * @param {Object} params { date }
   */
  getStatistics: async (params = {}) => {
    return await axiosClient.get('/admin/dashboard/stats', { params });
  },

  /**
   * Get doctor count by specialization
   */
  getDoctorSpecializations: async () => {
    return await axiosClient.get('/admin/dashboard/doctors-by-specialization');
  },

  /**
   * Get appointment status analytics
   */
  getAppointmentAnalytics: async () => {
    return await axiosClient.get('/admin/dashboard/appointment-analytics');
  },

  /**
   * Get recent appointments
   * @param {number} limit
   */
  getRecentAppointments: async (limit = 5) => {
    return await axiosClient.get('/admin/dashboard/recent-appointments', {
      params: { limit },
    });
  },

  /**
   * Get recent medical reports
   * @param {number} limit
   */
  getRecentReports: async (limit = 5) => {
    return await axiosClient.get('/admin/dashboard/recent-reports', {
      params: { limit },
    });
  },

  /**
   * Get recent prescriptions
   * @param {number} limit
   */
  getRecentPrescriptions: async (limit = 5) => {
    return await axiosClient.get('/admin/dashboard/recent-prescriptions', {
      params: { limit },
    });
  },
  /**
   * Create a new doctor account (Admin)
   */
  createDoctor: async (data) => {
    return await axiosClient.post('/doctors', data);
  },

  /**
   * Get all doctors with filters
   * @param {Object} params { search, department, specialization, limit }
   */
  getDoctors: async (params = { limit: 100 }) => {
    return await axiosClient.get('/doctors', { params });
  },

  /**
   * Update doctor profile details
   */
  updateDoctor: async (doctorId, data) => {
    return await axiosClient.patch(`/doctors/${doctorId}`, data);
  },

  /**
   * Delete / Deactivate a doctor
   */
  deleteDoctor: async (doctorId) => {
    return await axiosClient.delete(`/doctors/${doctorId}`);
  },
};

export default adminApi;

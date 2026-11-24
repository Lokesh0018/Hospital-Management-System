import axiosClient from './axiosClient.js';

export const patientApi = {
  /**
   * Get currently logged-in patient's profile and medical details
   */
  getProfile: async () => {
    return await axiosClient.get('/patients/profile/me');
  },

  /**
   * Update patient profile information
   * @param {Object} data { name, phone, gender, dateOfBirth, bloodGroup, emergencyContact, address, medicalHistory }
   */
  updateProfile: async (data) => {
    return await axiosClient.put('/patients/profile/me', data);
  },

  /**
   * Get patient's appointments (automatically scoped to logged-in patient)
   * @param {Object} params { status, date, page, limit }
   */
  getAppointments: async (params = {}) => {
    return await axiosClient.get('/appointments', { params });
  },

  /**
   * Book a new appointment
   * @param {Object} data { doctorId, appointmentDate, timeSlot, reason }
   */
  bookAppointment: async (data) => {
    return await axiosClient.post('/appointments', data);
  },

  /**
   * Cancel an appointment
   * @param {string} appointmentId
   * @param {Object} data { reason }
   */
  cancelAppointment: async (appointmentId, data = {}) => {
    return await axiosClient.patch(`/appointments/${appointmentId}/cancel`, data);
  },

  /**
   * Get diagnostic medical reports for current patient
   * @param {Object} params { status, reportType, page, limit }
   */
  getReports: async (params = {}) => {
    return await axiosClient.get('/reports', { params });
  },

  /**
   * Get single medical report details by ID
   * @param {string} reportId
   */
  getReportById: async (reportId) => {
    return await axiosClient.get(`/reports/${reportId}`);
  },

  /**
   * Get prescriptions issued to current patient
   * @param {Object} params { status, page, limit }
   */
  getPrescriptions: async (params = {}) => {
    return await axiosClient.get('/prescriptions/my-prescriptions', { params });
  },

  /**
   * Get doctors directory for appointment booking
   * @param {Object} params { search, specialization, limit }
   */
  getDoctors: async (params = { limit: 100 }) => {
    return await axiosClient.get('/doctors', { params });
  },

  /**
   * Check time slot availability for a doctor on a specific date
   * @param {string} doctorId
   * @param {string} date (YYYY-MM-DD)
   */
  getDoctorSlotAvailability: async (doctorId, date) => {
    return await axiosClient.get(`/appointments/doctor-availability/${doctorId}`, {
      params: { date }
    });
  }
};

export default patientApi;

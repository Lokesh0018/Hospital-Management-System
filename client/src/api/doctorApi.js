import axiosClient from './axiosClient.js';

export const doctorApi = {
  /**
   * Get doctor profile and session details
   */
  getProfile: async () => {
    return await axiosClient.get('/auth/me');
  },

  /**
   * Update doctor availability status (AVAILABLE, BUSY, ON_LEAVE)
   */
  updateAvailability: async (doctorId, availabilityStatus) => {
    return await axiosClient.patch(`/doctors/profile/status`, {
      availabilityStatus,
    });
  },

  /**
   * Get appointments for current doctor with filters
   * @param {Object} params { date, status, page, limit }
   */
  getAppointments: async (params = {}) => {
    return await axiosClient.get('/appointments', { params });
  },

  /**
   * Update appointment status and clinical notes
   * @param {string} appointmentId
   * @param {Object} data { status, notes, reason }
   */
  updateAppointment: async (appointmentId, data) => {
    return await axiosClient.patch(`/appointments/${appointmentId}`, data);
  },

  /**
   * Get medical reports assigned to the current doctor
   * @param {Object} params { status, reportType, page, limit }
   */
  getAssignedReports: async (params = {}) => {
    return await axiosClient.get('/reports/assigned', { params });
  },

  /**
   * Review assigned report and record clinical findings
   * @param {string} reportId
   * @param {Object} data { doctorNotes }
   */
  reviewReport: async (reportId, data) => {
    return await axiosClient.patch(`/reports/${reportId}/review`, data);
  },

  /**
   * Get prescriptions created by the current doctor
   * @param {Object} params { status, page, limit }
   */
  getCreatedPrescriptions: async (params = {}) => {
    return await axiosClient.get('/prescriptions/created-by-me', { params });
  },

  /**
   * Create a new prescription for a patient
   * @param {Object} data { patientId, appointmentId, reportId, diagnosis, instructions, medicines }
   */
  createPrescription: async (data) => {
    return await axiosClient.post('/prescriptions', data);
  },

  /**
   * Search / list patients for prescription selection
   */
  getPatients: async (params = {}) => {
    return await axiosClient.get('/patients', { params });
  },
};

export default doctorApi;

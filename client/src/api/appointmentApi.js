import axiosClient from './axiosClient.js';

export const appointmentApi = {
  /**
   * Get all appointments with filtering, search, and pagination
   * @param {Object} params { status, doctorId, patientId, date, search, page, limit, sortBy, sortOrder }
   */
  getAllAppointments: async (params = {}) => {
    return await axiosClient.get('/appointments', { params });
  },

  /**
   * Get single appointment details by ID
   * @param {string} appointmentId
   */
  getAppointmentById: async (appointmentId) => {
    return await axiosClient.get(`/appointments/${appointmentId}`);
  },

  /**
   * Book a new appointment
   * @param {Object} data { doctorId, appointmentDate, timeSlot, reason, patientId }
   */
  bookAppointment: async (data) => {
    return await axiosClient.post('/appointments', data);
  },

  /**
   * Update / Reschedule appointment
   * @param {string} appointmentId
   * @param {Object} data { appointmentDate, timeSlot, reason, notes, status }
   */
  updateAppointment: async (appointmentId, data) => {
    return await axiosClient.patch(`/appointments/${appointmentId}`, data);
  },

  /**
   * Update appointment status (Doctor or Admin)
   * @param {string} appointmentId
   * @param {Object} data { status, notes }
   */
  updateStatus: async (appointmentId, data) => {
    return await axiosClient.patch(`/appointments/${appointmentId}/status`, data);
  },

  /**
   * Cancel appointment with optional cancellation reason
   * @param {string} appointmentId
   * @param {Object} data { cancellationReason }
   */
  cancelAppointment: async (appointmentId, data = {}) => {
    return await axiosClient.patch(`/appointments/${appointmentId}/cancel`, data);
  },

  /**
   * Check live time slot availability for a doctor on a specific date
   * @param {string} doctorId
   * @param {string} date (YYYY-MM-DD)
   */
  getDoctorSlotAvailability: async (doctorId, date) => {
    return await axiosClient.get(`/appointments/doctor-availability/${doctorId}`, {
      params: { date }
    });
  },

  /**
   * Get supported statuses, time slots, and clinic hours metadata
   */
  getMetadata: async () => {
    return await axiosClient.get('/appointments/metadata');
  }
};

export default appointmentApi;

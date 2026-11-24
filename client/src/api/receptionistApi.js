import axiosClient from './axiosClient.js';

export const receptionistApi = {
  /**
   * Get front-desk receptionist dashboard overview (queue, today's schedule, new patients, dues)
   */
  getDashboard: async (params = {}) => {
    return await axiosClient.get('/receptionist/dashboard', { params });
  },

  /**
   * Get daily schedule timeline grouped by slot (MORNING, AFTERNOON, EVENING)
   * @param {Object} params { date, doctorId }
   */
  getSchedule: async (params = {}) => {
    return await axiosClient.get('/receptionist/schedule', { params });
  },

  /**
   * Register a new patient account & profile from front-desk intake
   * @param {Object} data { name, email, password, phone, gender, dateOfBirth, bloodGroup, emergencyContact, address, medicalHistory }
   */
  registerPatient: async (data) => {
    return await axiosClient.post('/patients', data);
  },

  /**
   * Update existing patient details
   * @param {string} patientId
   * @param {Object} data
   */
  updatePatient: async (patientId, data) => {
    return await axiosClient.put(`/patients/${patientId}`, data);
  },

  /**
   * Search / query patients directory
   * @param {Object} params { search, bloodGroup, gender, page, limit }
   */
  getPatients: async (params = {}) => {
    return await axiosClient.get('/patients', { params });
  },

  /**
   * Get patient details by ID
   * @param {string} patientId
   */
  getPatientById: async (patientId) => {
    return await axiosClient.get(`/patients/${patientId}`);
  },

  /**
   * Get supported patient metadata (blood groups, genders)
   */
  getPatientMetadata: async () => {
    return await axiosClient.get('/patients/meta/info');
  },

  /**
   * Check doctor availability and slots for a given date
   * @param {string} doctorId
   * @param {string} date YYYY-MM-DD
   */
  getDoctorAvailability: async (doctorId, date) => {
    return await axiosClient.get(`/appointments/doctor-availability/${doctorId}`, {
      params: { date }
    });
  },

  /**
   * Get all active doctors
   * @param {Object} params { search, department, specialization, limit }
   */
  getDoctors: async (params = { limit: 100 }) => {
    return await axiosClient.get('/doctors', { params });
  },

  /**
   * Update doctor's availability status (Receptionist)
   * @param {string} doctorId 
   * @param {string} status AVAILABLE | BUSY | ON_LEAVE
   */
  updateDoctorStatus: async (doctorId, status) => {
    return await axiosClient.patch(`/doctors/${doctorId}/status`, { availabilityStatus: status });
  },

  /**
   * Book appointment for patient at front-desk
   * @param {Object} data { patientId, doctorId, appointmentDate, timeSlot, reason }
   */
  bookAppointment: async (data) => {
    return await axiosClient.post('/appointments', data);
  },

  /**
   * Update appointment status (e.g. check-in patient -> CONFIRMED, COMPLETED)
   * @param {string} appointmentId
   * @param {string} status PENDING | CONFIRMED | COMPLETED | CANCELLED
   */
  updateAppointmentStatus: async (appointmentId, status) => {
    return await axiosClient.patch(`/appointments/${appointmentId}/status`, { status });
  },

  /**
   * Reschedule an appointment to a different date or time slot
   * @param {string} appointmentId
   * @param {Object} data { appointmentDate, timeSlot }
   */
  rescheduleAppointment: async (appointmentId, data) => {
    return await axiosClient.put(`/appointments/${appointmentId}`, data);
  },

  /**
   * Cancel an appointment with a reason
   * @param {string} appointmentId
   * @param {Object} data { cancellationReason }
   */
  cancelAppointment: async (appointmentId, data) => {
    return await axiosClient.patch(`/appointments/${appointmentId}/cancel`, data);
  },

  /**
   * Query invoices (with optional filters for patientId, status, etc.)
   * @param {Object} params { patientId, status, page, limit }
   */
  getInvoices: async (params = {}) => {
    return await axiosClient.get('/billing/invoices', { params });
  },

  /**
   * Generate a new invoice for patient
   * @param {Object} data { patientId, doctorId, appointmentId, notes, items }
   */
  createInvoice: async (data) => {
    return await axiosClient.post('/billing/invoices', data);
  },

  /**
   * Collect payment for an invoice (Cash, Card, UPI)
   * @param {string} invoiceId
   * @param {Object} data { amount, paymentMethod, notes, transactionReference }
   */
  collectPayment: async (invoiceId, data) => {
    return await axiosClient.post(`/billing/invoices/${invoiceId}/payments`, data);
  }
};

export default receptionistApi;

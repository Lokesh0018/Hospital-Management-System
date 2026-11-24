import axiosClient from './axiosClient.js';

export const prescriptionApi = {
  /**
   * List all prescriptions with filters, search, and pagination
   * @param {Object} params { status, doctorId, patientId, search, page, limit, sortBy, sortOrder }
   */
  getAllPrescriptions: async (params = {}) => {
    return await axiosClient.get('/prescriptions', { params });
  },

  /**
   * Patient views their own prescriptions
   * @param {Object} params { status, search, page, limit }
   */
  getMyPrescriptions: async (params = {}) => {
    return await axiosClient.get('/prescriptions/my-prescriptions', { params });
  },

  /**
   * Doctor views prescriptions created by them
   * @param {Object} params { status, search, page, limit }
   */
  getDoctorPrescriptions: async (params = {}) => {
    return await axiosClient.get('/prescriptions/created-by-me', { params });
  },

  /**
   * Get single prescription details by ID
   * @param {string} prescriptionId
   */
  getPrescriptionById: async (prescriptionId) => {
    return await axiosClient.get(`/prescriptions/${prescriptionId}`);
  },

  /**
   * Create a new prescription
   * @param {Object} data { patientId, doctorId, diagnosis, instructions, medicines }
   */
  createPrescription: async (data) => {
    return await axiosClient.post('/prescriptions', data);
  },

  /**
   * Update prescription status (ACTIVE, COMPLETED, CANCELLED)
   * @param {string} prescriptionId
   * @param {Object} data { status }
   */
  updateStatus: async (prescriptionId, data) => {
    return await axiosClient.patch(`/prescriptions/${prescriptionId}/status`, data);
  },

  /**
   * Update prescription diagnosis, instructions, or medicines
   * @param {string} prescriptionId
   * @param {Object} data { diagnosis, instructions, medicines }
   */
  updatePrescription: async (prescriptionId, data) => {
    return await axiosClient.patch(`/prescriptions/${prescriptionId}`, data);
  },

  /**
   * Delete prescription (Admin only)
   * @param {string} prescriptionId
   */
  deletePrescription: async (prescriptionId) => {
    return await axiosClient.delete(`/prescriptions/${prescriptionId}`);
  },

  /**
   * Get supported statuses metadata
   */
  getMetadata: async () => {
    return await axiosClient.get('/prescriptions/metadata');
  }
};

export default prescriptionApi;

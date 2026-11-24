import axiosClient from './axiosClient.js';

export const reportApi = {
  /**
   * List medical reports with search, filters, and pagination
   * @param {Object} params { status, reportType, doctorId, patientId, assignedToMe, search, page, limit, sortBy, sortOrder }
   */
  getAllReports: async (params = {}) => {
    return await axiosClient.get('/reports', { params });
  },

  /**
   * Get reports assigned specifically to the authenticated doctor
   * @param {Object} params { status, reportType, search, page, limit }
   */
  getAssignedReports: async (params = {}) => {
    return await axiosClient.get('/reports/assigned', { params });
  },

  /**
   * Get single medical report by ID
   * @param {string} reportId
   */
  getReportById: async (reportId) => {
    return await axiosClient.get(`/reports/${reportId}`);
  },

  /**
   * Create / Upload medical report metadata
   * @param {Object} data { title, description, reportType, fileUrl, fileType, fileSize, reportDate, patientId, doctorId }
   */
  createReport: async (data) => {
    return await axiosClient.post('/reports', data);
  },

  /**
   * Doctor reviews report and adds clinical findings / impressions
   * @param {string} reportId
   * @param {Object} data { doctorNotes, status }
   */
  reviewReport: async (reportId, data) => {
    return await axiosClient.patch(`/reports/${reportId}/review`, data);
  },

  /**
   * Update medical report metadata
   * @param {string} reportId
   * @param {Object} data { title, description, reportType, fileUrl, doctorId, status }
   */
  updateReport: async (reportId, data) => {
    return await axiosClient.patch(`/reports/${reportId}`, data);
  },

  /**
   * Delete medical report (Admin or Lab Technician)
   * @param {string} reportId
   */
  deleteReport: async (reportId) => {
    return await axiosClient.delete(`/reports/${reportId}`);
  },

  /**
   * Get supported report types and statuses metadata
   */
  getMetadata: async () => {
    return await axiosClient.get('/reports/metadata');
  }
};

export default reportApi;

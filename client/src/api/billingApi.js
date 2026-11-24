import axiosClient from './axiosClient.js';

export const billingApi = {
  /**
   * Get hospital billing and financial statistics (Admin / Staff)
   * @param {Object} params { date }
   */
  getStats: async (params = {}) => {
    return await axiosClient.get('/billing/stats', { params });
  },

  /**
   * List all invoices with filters and pagination
   * @param {Object} params { status, patientId, doctorId, startDate, endDate, search, page, limit, sortBy, sortOrder }
   */
  getAllInvoices: async (params = {}) => {
    return await axiosClient.get('/billing/invoices', { params });
  },

  /**
   * Patient self-service: list own invoices
   * @param {Object} params { status, search, page, limit }
   */
  getMyInvoices: async (params = {}) => {
    return await axiosClient.get('/billing/invoices/my-invoices', { params });
  },

  /**
   * Get single invoice dossier with items and payment history
   * @param {string} invoiceId
   */
  getInvoiceById: async (invoiceId) => {
    return await axiosClient.get(`/billing/invoices/${invoiceId}`);
  },

  /**
   * Create a new invoice with line items
   * @param {Object} data { patientId, doctorId, appointmentId, dueDate, discount, tax, notes, items }
   */
  createInvoice: async (data) => {
    return await axiosClient.post('/billing/invoices', data);
  },

  /**
   * Record/process payment for an invoice (Admin, Staff, or Patient paying own bill)
   * @param {string} invoiceId
   * @param {Object} paymentData { amount, paymentMethod, notes }
   */
  recordPayment: async (invoiceId, paymentData) => {
    return await axiosClient.post(`/billing/invoices/${invoiceId}/payments`, paymentData);
  },

  /**
   * Cancel an unpaid invoice (Admin only)
   * @param {string} invoiceId
   * @param {string} reason
   */
  cancelInvoice: async (invoiceId, reason = '') => {
    return await axiosClient.patch(`/billing/invoices/${invoiceId}/cancel`, { reason });
  },

  /**
   * Update invoice details (notes, due date, tax, discount)
   * @param {string} invoiceId
   * @param {Object} data
   */
  updateInvoice: async (invoiceId, data) => {
    return await axiosClient.put(`/billing/invoices/${invoiceId}`, data);
  },

  /**
   * List payment transactions
   * @param {Object} params { patientId, billId, paymentMethod, page, limit }
   */
  getAllPayments: async (params = {}) => {
    return await axiosClient.get('/billing/payments', { params });
  },

  /**
   * Patient self-service: list own payment transactions
   */
  getMyPayments: async (params = {}) => {
    return await axiosClient.get('/billing/payments/my-payments', { params });
  },

  /**
   * Get billing metadata (supported statuses, payment methods, item types)
   */
  getMetadata: async () => {
    return await axiosClient.get('/billing/metadata');
  }
};

export default billingApi;

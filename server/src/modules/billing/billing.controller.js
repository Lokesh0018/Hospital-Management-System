import { BillingService } from './billing.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';

export class BillingController {
  /**
   * Helper: Resolves patient profile ID from logged-in user
   */
  static async resolvePatientProfileId(userId) {
    const profile = await prisma.patientProfile.findUnique({
      where: { userId }
    });
    if (!profile) {
      throw ApiError.notFound('Patient profile not found for this user account.');
    }
    return profile.id;
  }

  /**
   * Public / Metadata
   */
  static async getMetadata(req, res, next) {
    try {
      const metadata = BillingService.getMetadata();
      return ApiResponse.ok(res, metadata, 'Billing metadata retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get financial KPIs and statistics
   */
  static async getStatistics(req, res, next) {
    try {
      const stats = await BillingService.getStatistics(req.query);
      return ApiResponse.ok(res, stats, 'Hospital billing statistics retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new invoice
   */
  static async createInvoice(req, res, next) {
    try {
      const invoice = await BillingService.createInvoice(req.body, req.user);
      return ApiResponse.created(res, invoice, 'Invoice generated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all hospital invoices (Admin / Staff)
   */
  static async getAllInvoices(req, res, next) {
    try {
      const data = await BillingService.getAllInvoices(req.query);
      return ApiResponse.ok(res, data, 'Invoices retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Patient convenience endpoint: List own invoices
   */
  static async getMyInvoices(req, res, next) {
    try {
      const patientProfileId = await BillingController.resolvePatientProfileId(req.user.id);
      const data = await BillingService.getAllInvoices({
        ...req.query,
        patientId: patientProfileId
      });
      return ApiResponse.ok(res, data, 'Your invoices retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single invoice details by ID
   */
  static async getInvoiceById(req, res, next) {
    try {
      const invoice = await BillingService.getInvoiceById(req.params.id, req.user);
      return ApiResponse.ok(res, invoice, 'Invoice details retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Record payment for an invoice (Admin, Staff, or Patient paying own bill)
   */
  static async recordPayment(req, res, next) {
    try {
      const updatedInvoice = await BillingService.recordPayment(
        req.params.id,
        req.body,
        req.user
      );
      return ApiResponse.ok(res, updatedInvoice, 'Payment processed and recorded successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update invoice notes, due date, tax, discount
   */
  static async updateInvoice(req, res, next) {
    try {
      const updated = await BillingService.updateInvoice(req.params.id, req.body);
      return ApiResponse.ok(res, updated, 'Invoice updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel an unpaid invoice (Admin only)
   */
  static async cancelInvoice(req, res, next) {
    try {
      const reason = req.body?.reason || req.query?.reason;
      const cancelled = await BillingService.cancelInvoice(req.params.id, reason);
      return ApiResponse.ok(res, cancelled, 'Invoice cancelled successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * List payment transactions
   */
  static async getAllPayments(req, res, next) {
    try {
      const data = await BillingService.getAllPayments(req.query);
      return ApiResponse.ok(res, data, 'Payment records retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Patient convenience endpoint: List own payment transactions
   */
  static async getMyPayments(req, res, next) {
    try {
      const patientProfileId = await BillingController.resolvePatientProfileId(req.user.id);
      const data = await BillingService.getAllPayments({
        ...req.query,
        patientId: patientProfileId
      });
      return ApiResponse.ok(res, data, 'Your payment transactions retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }
}

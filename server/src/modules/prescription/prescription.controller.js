import { PrescriptionService } from './prescription.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { PRESCRIPTION_STATUS_LIST } from './prescription.validation.js';

export class PrescriptionController {
  /**
   * Doctor creates a new prescription for a patient (Doctor or Admin)
   */
  static async createPrescription(req, res, next) {
    try {
      const prescription = await PrescriptionService.createPrescription(req.user, req.body);
      return ApiResponse.created(res, prescription, 'Prescription created successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all prescriptions with filtering, search, and RBAC rules
   */
  static async getAllPrescriptions(req, res, next) {
    try {
      const result = await PrescriptionService.getAllPrescriptions(req.user, req.query);
      return ApiResponse.ok(res, result, 'Prescriptions retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single prescription by ID
   */
  static async getPrescriptionById(req, res, next) {
    try {
      const prescription = await PrescriptionService.getPrescriptionById(req.user, req.params.id);
      return ApiResponse.ok(res, prescription, 'Prescription details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Patient views their own prescriptions (Patient self-service)
   */
  static async getMyPrescriptions(req, res, next) {
    try {
      const result = await PrescriptionService.getAllPrescriptions(req.user, req.query);
      return ApiResponse.ok(res, result, 'Your prescriptions retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor views prescriptions created by them (Doctor self-service)
   */
  static async getDoctorPrescriptions(req, res, next) {
    try {
      const result = await PrescriptionService.getAllPrescriptions(req.user, req.query);
      return ApiResponse.ok(res, result, 'Doctor prescriptions retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update prescription details or medicines
   */
  static async updatePrescription(req, res, next) {
    try {
      const updated = await PrescriptionService.updatePrescription(req.user, req.params.id, req.body);
      return ApiResponse.ok(res, updated, 'Prescription updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Directly update prescription status (ACTIVE, COMPLETED, CANCELLED)
   */
  static async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await PrescriptionService.updateStatus(req.user, req.params.id, status);
      return ApiResponse.ok(res, updated, `Prescription status updated to ${status}.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete prescription (Admin only)
   */
  static async deletePrescription(req, res, next) {
    try {
      const result = await PrescriptionService.deletePrescription(req.user, req.params.id);
      return ApiResponse.ok(res, result, 'Prescription removed successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supported statuses metadata
   */
  static async getMetadata(req, res, next) {
    try {
      return ApiResponse.ok(
        res,
        {
          statuses: PRESCRIPTION_STATUS_LIST
        },
        'Prescription metadata retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }
}

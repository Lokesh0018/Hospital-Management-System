import { DoctorService } from './doctor.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { DOCTOR_SPECIALIZATIONS, AVAILABILITY_STATUS_LIST } from './doctor.validation.js';

export class DoctorController {
  /**
   * Create a new doctor account with profile (Admin only)
   */
  static async createDoctor(req, res, next) {
    try {
      const doctor = await DoctorService.createDoctor(req.body);
      return ApiResponse.created(res, doctor, 'Doctor account created successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of doctors with optional filtering, search, and pagination
   */
  static async getAllDoctors(req, res, next) {
    try {
      const result = await DoctorService.getAllDoctors(req.query);
      return ApiResponse.ok(res, result, 'Doctors retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor by ID (User ID or DoctorProfile ID)
   */
  static async getDoctorById(req, res, next) {
    try {
      const doctor = await DoctorService.getDoctorById(req.params.id);
      return ApiResponse.ok(res, doctor, 'Doctor details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update doctor details (Admin)
   */
  static async updateDoctor(req, res, next) {
    try {
      const updatedDoctor = await DoctorService.updateDoctor(req.params.id, req.body);
      return ApiResponse.ok(res, updatedDoctor, 'Doctor updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a doctor account and profile (Admin)
   */
  static async deleteDoctor(req, res, next) {
    try {
      const result = await DoctorService.deleteDoctor(req.params.id);
      return ApiResponse.ok(res, result, 'Doctor removed successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated doctor's profile (Doctor)
   */
  static async getMyProfile(req, res, next) {
    try {
      const profile = await DoctorService.getDoctorProfileByUserId(req.user.id);
      return ApiResponse.ok(res, profile, 'Doctor profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update authenticated doctor's profile (Doctor)
   */
  static async updateMyProfile(req, res, next) {
    try {
      const updated = await DoctorService.updateDoctorProfileByUserId(req.user.id, req.body);
      return ApiResponse.ok(res, updated, 'Doctor profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update authenticated doctor's availability status (Doctor)
   */
  static async updateMyStatus(req, res, next) {
    try {
      const { availabilityStatus } = req.body;
      const result = await DoctorService.updateAvailabilityStatus(req.user.id, availabilityStatus);
      return ApiResponse.ok(res, result, 'Doctor availability status updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update any doctor's availability status (Admin)
   */
  static async updateDoctorStatus(req, res, next) {
    try {
      const { availabilityStatus } = req.body;
      const result = await DoctorService.updateAvailabilityStatus(req.params.id, availabilityStatus);
      return ApiResponse.ok(res, result, 'Doctor availability status updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of supported specializations and availability statuses for frontend discovery
   */
  static async getSpecializations(req, res, next) {
    try {
      return ApiResponse.ok(
        res,
        {
          specializations: DOCTOR_SPECIALIZATIONS,
          availabilityStatuses: AVAILABILITY_STATUS_LIST
        },
        'Specialization and status metadata retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }
}

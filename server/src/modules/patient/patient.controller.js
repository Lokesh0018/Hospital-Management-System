import { PatientService } from './patient.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { BLOOD_GROUPS, GENDERS } from './patient.validation.js';

export class PatientController {
  /**
   * Create a new patient account with profile (Admin / Receptionist)
   */
  static async createPatient(req, res, next) {
    try {
      const patient = await PatientService.createPatient(req.body);
      return ApiResponse.created(res, patient, 'Patient account created successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all patients with filtering, search, and pagination (Admin / Receptionist / Doctor)
   */
  static async getAllPatients(req, res, next) {
    try {
      const result = await PatientService.getAllPatients(req.query);
      return ApiResponse.ok(res, result, 'Patients retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient details by ID
   */
  static async getPatientById(req, res, next) {
    try {
      const patient = await PatientService.getPatientById(req.user, req.params.id);
      return ApiResponse.ok(res, patient, 'Patient details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update patient details (Admin / Receptionist)
   */
  static async updatePatient(req, res, next) {
    try {
      const updated = await PatientService.updatePatient(req.params.id, req.body);
      return ApiResponse.ok(res, updated, 'Patient details updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a patient account and profile (Admin)
   */
  static async deletePatient(req, res, next) {
    try {
      const result = await PatientService.deletePatient(req.params.id);
      return ApiResponse.ok(res, result, 'Patient removed successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get authenticated patient's profile (Patient self-service)
   */
  static async getMyProfile(req, res, next) {
    try {
      const profile = await PatientService.getPatientProfileByUserId(req.user.id);
      return ApiResponse.ok(res, profile, 'Patient profile retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update authenticated patient's profile (Patient self-service)
   */
  static async updateMyProfile(req, res, next) {
    try {
      const updated = await PatientService.updatePatientProfileByUserId(req.user.id, req.body);
      return ApiResponse.ok(res, updated, 'Patient profile updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get patient's medical history
   */
  static async getMedicalHistory(req, res, next) {
    try {
      const medicalHistory = await PatientService.getMedicalHistory(req.user, req.params.id);
      return ApiResponse.ok(res, medicalHistory, 'Medical history retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update or append patient's medical history
   */
  static async updateMedicalHistory(req, res, next) {
    try {
      const { medicalHistory, append } = req.body;
      const updated = await PatientService.updateMedicalHistory(
        req.user,
        req.params.id,
        medicalHistory,
        append
      );
      return ApiResponse.ok(res, updated, 'Medical history updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supported blood groups and genders metadata for frontend
   */
  static async getMetadata(req, res, next) {
    try {
      return ApiResponse.ok(
        res,
        {
          bloodGroups: BLOOD_GROUPS,
          genders: GENDERS
        },
        'Patient metadata retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }
}

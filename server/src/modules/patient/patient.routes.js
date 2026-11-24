import { Router } from 'express';
import { PatientController } from './patient.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  createPatientSchema,
  updatePatientSchema,
  updatePatientProfileSchema,
  updateMedicalHistorySchema,
  patientQuerySchema,
  patientIdParamSchema
} from './patient.validation.js';

const router = Router();

// ============================================
// Public / Metadata Endpoints
// ============================================

// Get supported blood groups and genders
router.get('/metadata', PatientController.getMetadata);

// ============================================
// Patient Self-Service Profile Endpoints
// (Requires PATIENT role)
// ============================================

// Get currently logged-in patient's profile
router.get(
  '/profile/me',
  authenticate,
  authorize(ROLES.PATIENT),
  PatientController.getMyProfile
);

// Update currently logged-in patient's profile
router.put(
  '/profile/me',
  authenticate,
  authorize(ROLES.PATIENT),
  validate(updatePatientProfileSchema),
  PatientController.updateMyProfile
);

// ============================================
// Staff & Clinical Endpoints
// ============================================

// List all patients with search, filters, and pagination (Admin, Receptionist, Doctor)
router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  validate(patientQuerySchema, 'query'),
  PatientController.getAllPatients
);

// Create a new patient account and profile (Admin, Receptionist)
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(createPatientSchema),
  PatientController.createPatient
);

// ============================================
// Medical History Management
// ============================================

// View patient's medical history
router.get(
  '/:id/medical-history',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT),
  validate(patientIdParamSchema, 'params'),
  PatientController.getMedicalHistory
);

// Update or append to patient's medical history
router.patch(
  '/:id/medical-history',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.PATIENT),
  validate(patientIdParamSchema, 'params'),
  validate(updateMedicalHistorySchema),
  PatientController.updateMedicalHistory
);

// ============================================
// Patient Resource by ID
// ============================================

// Get patient details by ID (Patient can view self; Admin, Receptionist, Doctor can view any)
router.get(
  '/:id',
  authenticate,
  validate(patientIdParamSchema, 'params'),
  PatientController.getPatientById
);

// Update patient record (Admin, Receptionist)
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(patientIdParamSchema, 'params'),
  validate(updatePatientSchema),
  PatientController.updatePatient
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(patientIdParamSchema, 'params'),
  validate(updatePatientSchema),
  PatientController.updatePatient
);

// Delete patient record and user account (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(patientIdParamSchema, 'params'),
  PatientController.deletePatient
);

export default router;

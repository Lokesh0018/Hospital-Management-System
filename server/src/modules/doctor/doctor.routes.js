import { Router } from 'express';
import { DoctorController } from './doctor.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
  updateDoctorProfileSchema,
  updateStatusSchema,
  doctorQuerySchema,
  doctorIdParamSchema
} from './doctor.validation.js';

const router = Router();

// ============================================
// Public / General Doctor Endpoints
// ============================================

// Get list of supported doctor specializations and availability statuses
router.get('/specializations', DoctorController.getSpecializations);

// Get all doctors with filtering, search, and pagination (public or authenticated)
router.get('/', validate(doctorQuerySchema, 'query'), DoctorController.getAllDoctors);

// ============================================
// Doctor Self-Service Profile Endpoints
// (Requires DOCTOR role)
// ============================================

// Get currently logged-in doctor's profile
router.get('/profile/me', authenticate, authorize(ROLES.DOCTOR), DoctorController.getMyProfile);

// Update currently logged-in doctor's profile
router.put(
  '/profile/me',
  authenticate,
  authorize(ROLES.DOCTOR),
  validate(updateDoctorProfileSchema),
  DoctorController.updateMyProfile
);

// Quick update for currently logged-in doctor's availability status
router.patch(
  '/profile/status',
  authenticate,
  authorize(ROLES.DOCTOR),
  validate(updateStatusSchema),
  DoctorController.updateMyStatus
);

// ============================================
// Administrative Doctor Management Endpoints
// (Requires ADMIN role for mutations)
// ============================================

// Create a new doctor account with profile
router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(createDoctorSchema),
  DoctorController.createDoctor
);

// Quick update for any doctor's availability status (Admin, Receptionist)
router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(doctorIdParamSchema, 'params'),
  validate(updateStatusSchema),
  DoctorController.updateDoctorStatus
);

// Get single doctor details by ID
router.get(
  '/:id',
  validate(doctorIdParamSchema, 'params'),
  DoctorController.getDoctorById
);

// Update doctor details (Admin)
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(doctorIdParamSchema, 'params'),
  validate(updateDoctorSchema),
  DoctorController.updateDoctor
);

// Delete doctor account and profile (Admin)
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(doctorIdParamSchema, 'params'),
  DoctorController.deleteDoctor
);

export default router;

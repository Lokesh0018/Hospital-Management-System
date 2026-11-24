import { Router } from 'express';
import { PrescriptionController } from './prescription.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  updateStatusSchema,
  prescriptionQuerySchema,
  prescriptionIdParamSchema
} from './prescription.validation.js';

const router = Router();

// ============================================
// Public / Metadata Endpoints
// ============================================

router.get('/metadata', PrescriptionController.getMetadata);

// ============================================
// Role-Specific Convenience Endpoints
// ============================================

// Patient views their own prescriptions
router.get(
  '/my-prescriptions',
  authenticate,
  authorize(ROLES.PATIENT),
  validate(prescriptionQuerySchema, 'query'),
  PrescriptionController.getMyPrescriptions
);

// Doctor views prescriptions created by them
router.get(
  '/created-by-me',
  authenticate,
  authorize(ROLES.DOCTOR),
  validate(prescriptionQuerySchema, 'query'),
  PrescriptionController.getDoctorPrescriptions
);

// ============================================
// Authenticated Prescription Management
// ============================================

// List all prescriptions with filters, search, and pagination
router.get(
  '/',
  authenticate,
  validate(prescriptionQuerySchema, 'query'),
  PrescriptionController.getAllPrescriptions
);

// Doctor creates a prescription for a patient
router.post(
  '/',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  validate(createPrescriptionSchema),
  PrescriptionController.createPrescription
);

// Directly update prescription status (ACTIVE, COMPLETED, CANCELLED)
router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  validate(prescriptionIdParamSchema, 'params'),
  validate(updateStatusSchema),
  PrescriptionController.updateStatus
);

// Get single prescription details by ID
router.get(
  '/:id',
  authenticate,
  validate(prescriptionIdParamSchema, 'params'),
  PrescriptionController.getPrescriptionById
);

// Update prescription diagnosis, instructions, or medicines
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  validate(prescriptionIdParamSchema, 'params'),
  validate(updatePrescriptionSchema),
  PrescriptionController.updatePrescription
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  validate(prescriptionIdParamSchema, 'params'),
  validate(updatePrescriptionSchema),
  PrescriptionController.updatePrescription
);

// Delete prescription (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(prescriptionIdParamSchema, 'params'),
  PrescriptionController.deletePrescription
);

export default router;

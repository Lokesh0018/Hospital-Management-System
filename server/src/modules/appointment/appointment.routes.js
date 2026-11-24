import { Router } from 'express';
import { AppointmentController } from './appointment.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  bookAppointmentSchema,
  updateAppointmentSchema,
  updateStatusSchema,
  cancelAppointmentSchema,
  appointmentQuerySchema,
  doctorAvailabilityQuerySchema,
  appointmentIdParamSchema
} from './appointment.validation.js';

const router = Router();

// ============================================
// Public / Informational Endpoints
// ============================================

// Get supported appointment statuses and time slots
router.get('/metadata', AppointmentController.getMetadata);

// Check time slot availability for a doctor on a specific date (?date=YYYY-MM-DD)
router.get(
  '/doctor-availability/:doctorId',
  validate(doctorAvailabilityQuerySchema, 'query'),
  AppointmentController.getDoctorSlotAvailability
);

// ============================================
// Authenticated Appointment Management
// ============================================

// List appointments with role-based visibility and filters
router.get(
  '/',
  authenticate,
  validate(appointmentQuerySchema, 'query'),
  AppointmentController.getAllAppointments
);

// Book a new appointment (Patients or Admins)
router.post(
  '/',
  authenticate,
  authorize(ROLES.PATIENT, ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(bookAppointmentSchema),
  AppointmentController.bookAppointment
);

// Update appointment status directly (Doctor, Admin, Receptionist)
router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(appointmentIdParamSchema, 'params'),
  validate(updateStatusSchema),
  AppointmentController.updateStatus
);

// Cancel an appointment (Patient for their own, Doctor for assigned, Admin for any)
router.patch(
  '/:id/cancel',
  authenticate,
  validate(appointmentIdParamSchema, 'params'),
  validate(cancelAppointmentSchema),
  AppointmentController.cancelAppointment
);

// Get single appointment details by ID
router.get(
  '/:id',
  authenticate,
  validate(appointmentIdParamSchema, 'params'),
  AppointmentController.getAppointmentById
);

// Update appointment details / reschedule
router.put(
  '/:id',
  authenticate,
  validate(appointmentIdParamSchema, 'params'),
  validate(updateAppointmentSchema),
  AppointmentController.updateAppointment
);

router.patch(
  '/:id',
  authenticate,
  validate(appointmentIdParamSchema, 'params'),
  validate(updateAppointmentSchema),
  AppointmentController.updateAppointment
);

export default router;

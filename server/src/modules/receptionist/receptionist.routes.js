import { Router } from 'express';
import { ReceptionistController } from './receptionist.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  dashboardQuerySchema,
  scheduleQuerySchema
} from './receptionist.validation.js';

const router = Router();

// Require authentication and either RECEPTIONIST or ADMIN role for all receptionist routes
router.use(authenticate, authorize(ROLES.RECEPTIONIST, ROLES.ADMIN));

/**
 * GET /api/v1/receptionist/dashboard
 * Front-desk dashboard overview, queue metrics, today's schedule, recent registrations, and unpaid dues
 */
router.get(
  '/dashboard',
  validate(dashboardQuerySchema, 'query'),
  ReceptionistController.getDashboardOverview
);

/**
 * GET /api/v1/receptionist/schedule
 * Daily appointment timeline grouped by slots (Morning, Afternoon, Evening) and doctor filter
 */
router.get(
  '/schedule',
  validate(scheduleQuerySchema, 'query'),
  ReceptionistController.getDailySchedule
);

export default router;

import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  dashboardQuerySchema,
  recentActivityQuerySchema,
  statsQuerySchema
} from './admin.validation.js';

const router = Router();

// ============================================
// Secure ADMIN-Only Guard
// Requires valid JWT and ADMIN role
// ============================================
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

// ============================================
// Dashboard Overview & Statistics Endpoints
// ============================================

// Full Unified Dashboard (All 15 metrics in one payload)
router.get(
  '/',
  validate(dashboardQuerySchema, 'query'),
  AdminController.getDashboardOverview
);

router.get(
  '/dashboard',
  validate(dashboardQuerySchema, 'query'),
  AdminController.getDashboardOverview
);

// Core KPI Statistics (Requirements 1 - 10)
router.get(
  '/stats',
  validate(statsQuerySchema, 'query'),
  AdminController.getStatistics
);

router.get(
  '/dashboard/stats',
  validate(statsQuerySchema, 'query'),
  AdminController.getStatistics
);

// ============================================
// Granular Analytics & Demographics Endpoints
// ============================================

// 14. Doctor Count by Specialization
router.get(
  '/doctors-by-specialization',
  AdminController.getDoctorCountBySpecialization
);

router.get(
  '/dashboard/doctors-by-specialization',
  AdminController.getDoctorCountBySpecialization
);

// 15. Appointment Status Analytics
router.get(
  '/appointment-analytics',
  AdminController.getAppointmentStatusAnalytics
);

router.get(
  '/dashboard/appointment-analytics',
  AdminController.getAppointmentStatusAnalytics
);

// ============================================
// Recent Activity Feed Endpoints
// ============================================

// 11. Recent Appointments
router.get(
  '/recent-appointments',
  validate(recentActivityQuerySchema, 'query'),
  AdminController.getRecentAppointments
);

router.get(
  '/dashboard/recent-appointments',
  validate(recentActivityQuerySchema, 'query'),
  AdminController.getRecentAppointments
);

// 12. Recent Reports
router.get(
  '/recent-reports',
  validate(recentActivityQuerySchema, 'query'),
  AdminController.getRecentReports
);

router.get(
  '/dashboard/recent-reports',
  validate(recentActivityQuerySchema, 'query'),
  AdminController.getRecentReports
);

// 13. Recent Prescriptions
router.get(
  '/recent-prescriptions',
  validate(recentActivityQuerySchema, 'query'),
  AdminController.getRecentPrescriptions
);

router.get(
  '/dashboard/recent-prescriptions',
  validate(recentActivityQuerySchema, 'query'),
  AdminController.getRecentPrescriptions
);

export default router;

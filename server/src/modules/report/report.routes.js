import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  createReportSchema,
  updateReportSchema,
  reviewReportSchema,
  reportQuerySchema,
  reportIdParamSchema
} from './report.validation.js';

const router = Router();

// ============================================
// Public / Metadata Endpoints
// ============================================

// Get supported report types and statuses
router.get('/metadata', ReportController.getMetadata);

// ============================================
// Doctor Assigned Reports Endpoint
// ============================================

// Get reports assigned to the authenticated doctor
router.get(
  '/assigned',
  authenticate,
  authorize(ROLES.DOCTOR),
  validate(reportQuerySchema, 'query'),
  ReportController.getAssignedReports
);

// ============================================
// Authenticated Report Management
// ============================================

// List reports with filters, search, and pagination
router.get(
  '/',
  authenticate,
  validate(reportQuerySchema, 'query'),
  ReportController.getAllReports
);

// Upload / Create medical report metadata
router.post(
  '/',
  authenticate,
  validate(createReportSchema),
  ReportController.createReport
);

// Doctor reviews report and adds clinical notes / impressions
router.patch(
  '/:id/review',
  authenticate,
  authorize(ROLES.DOCTOR, ROLES.ADMIN),
  validate(reportIdParamSchema, 'params'),
  validate(reviewReportSchema),
  ReportController.reviewReport
);

// Get single medical report details by ID
router.get(
  '/:id',
  authenticate,
  validate(reportIdParamSchema, 'params'),
  ReportController.getReportById
);

// Update medical report metadata
router.put(
  '/:id',
  authenticate,
  validate(reportIdParamSchema, 'params'),
  validate(updateReportSchema),
  ReportController.updateReport
);

router.patch(
  '/:id',
  authenticate,
  validate(reportIdParamSchema, 'params'),
  validate(updateReportSchema),
  ReportController.updateReport
);

// Delete medical report (Admin or Lab Technician)
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.LAB_TECHNICIAN),
  validate(reportIdParamSchema, 'params'),
  ReportController.deleteReport
);

export default router;

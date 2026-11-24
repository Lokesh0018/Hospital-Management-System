import { Router } from 'express';
import { LabController } from './lab.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// ============================================
// Secure LAB_TECHNICIAN Guard
// ============================================
router.use(authenticate);
router.use(authorize(ROLES.LAB_TECHNICIAN, ROLES.ADMIN));

// ============================================
// Dashboard Endpoints
// ============================================
router.get(
  '/dashboard',
  LabController.getDashboardOverview
);

export default router;

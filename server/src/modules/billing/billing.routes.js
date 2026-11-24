import { Router } from 'express';
import { BillingController } from './billing.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { ROLES } from '../../constants/roles.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  recordPaymentSchema,
  invoiceQuerySchema,
  invoiceIdParamSchema
} from './billing.validation.js';

const router = Router();

// ============================================
// Public / Metadata Endpoints
// ============================================

router.get('/metadata', BillingController.getMetadata);

// ============================================
// Financial Analytics & Statistics (Admin / Staff)
// ============================================

router.get(
  '/stats',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  BillingController.getStatistics
);

// ============================================
// Patient Self-Service Endpoints
// ============================================

router.get(
  '/invoices/my-invoices',
  authenticate,
  authorize(ROLES.PATIENT),
  validate(invoiceQuerySchema, 'query'),
  BillingController.getMyInvoices
);

router.get(
  '/payments/my-payments',
  authenticate,
  authorize(ROLES.PATIENT),
  BillingController.getMyPayments
);

// ============================================
// Invoice Management Endpoints
// ============================================

// List all invoices (Admin, Receptionist, Doctor)
router.get(
  '/invoices',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST, ROLES.DOCTOR),
  validate(invoiceQuerySchema, 'query'),
  BillingController.getAllInvoices
);

// Create new invoice (Admin, Receptionist)
router.post(
  '/invoices',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(createInvoiceSchema),
  BillingController.createInvoice
);

// Get single invoice by ID (Any authenticated role with ownership check)
router.get(
  '/invoices/:id',
  authenticate,
  validate(invoiceIdParamSchema, 'params'),
  BillingController.getInvoiceById
);

// Update invoice details (Admin, Receptionist)
router.put(
  '/invoices/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  validate(invoiceIdParamSchema, 'params'),
  validate(updateInvoiceSchema),
  BillingController.updateInvoice
);

// Cancel invoice (Admin only)
router.patch(
  '/invoices/:id/cancel',
  authenticate,
  authorize(ROLES.ADMIN),
  validate(invoiceIdParamSchema, 'params'),
  BillingController.cancelInvoice
);

// Record payment (Admin, Receptionist, or Patient paying own bill)
router.post(
  '/invoices/:id/payments',
  authenticate,
  validate(invoiceIdParamSchema, 'params'),
  validate(recordPaymentSchema),
  BillingController.recordPayment
);

// ============================================
// Payment Records Ledger (Admin / Staff)
// ============================================

router.get(
  '/payments',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RECEPTIONIST),
  BillingController.getAllPayments
);

export default router;

import { z } from 'zod';

/**
 * Bill / Invoice Lifecycle Statuses
 */
export const BILL_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED'
});

export const BILL_STATUS_LIST = Object.values(BILL_STATUS);

/**
 * Line Item Categories
 */
export const BILL_ITEM_TYPES = Object.freeze({
  CONSULTATION: 'CONSULTATION',
  PROCEDURE: 'PROCEDURE',
  LAB_TEST: 'LAB_TEST',
  MEDICATION: 'MEDICATION',
  ROOM_CHARGE: 'ROOM_CHARGE',
  OTHER: 'OTHER'
});

export const BILL_ITEM_TYPES_LIST = Object.values(BILL_ITEM_TYPES);

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = Object.freeze({
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  ONLINE: 'ONLINE',
  INSURANCE: 'INSURANCE',
  UPI: 'UPI'
});

export const PAYMENT_METHODS_LIST = Object.values(PAYMENT_METHODS);

/**
 * Payment Transaction Statuses
 */
export const PAYMENT_STATUS = Object.freeze({
  SUCCESS: 'SUCCESS',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
});

export const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);

/**
 * Validation schema for a single line item
 */
export const billItemSchema = z.object({
  itemType: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.enum(BILL_ITEM_TYPES_LIST, {
      errorMap: () => ({
        message: `Item type must be one of: ${BILL_ITEM_TYPES_LIST.join(', ')}`
      })
    })
  ),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description cannot exceed 255 characters'),
  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int('Quantity must be an integer').min(1, 'Quantity must be at least 1').default(1)
  ),
  unitPrice: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0, 'Unit price cannot be negative')
  )
});

/**
 * Schema for creating a new Invoice
 */
export const createInvoiceSchema = z.object({
  patientId: z.string().uuid('Invalid Patient Profile ID format'),
  doctorId: z.string().uuid('Invalid Doctor Profile ID format').optional().nullable(),
  appointmentId: z.string().uuid('Invalid Appointment ID format').optional().nullable(),
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'dueDate must be a valid date format (ISO 8601)'
    }),
  discount: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 0 : parseFloat(val)),
    z.number().min(0, 'Discount cannot be negative').default(0)
  ),
  tax: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? 0 : parseFloat(val)),
    z.number().min(0, 'Tax cannot be negative').default(0)
  ),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
  items: z
    .array(billItemSchema)
    .min(1, 'At least one line item is required to generate an invoice')
});

/**
 * Schema for updating an invoice (notes, due date, discount/tax if unpaid)
 */
export const updateInvoiceSchema = z.object({
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'dueDate must be a valid date format (ISO 8601)'
    }),
  notes: z.string().trim().max(1000).optional().nullable(),
  discount: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : parseFloat(val)),
    z.number().min(0).optional()
  ),
  tax: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : parseFloat(val)),
    z.number().min(0).optional()
  )
});

/**
 * Schema for recording a payment transaction
 */
export const recordPaymentSchema = z.object({
  amount: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().positive('Payment amount must be greater than 0')
  ),
  paymentMethod: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.enum(PAYMENT_METHODS_LIST, {
      errorMap: () => ({
        message: `Payment method must be one of: ${PAYMENT_METHODS_LIST.join(', ')}`
      })
    })
  ),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable()
});

/**
 * Schema for invoice queries / filtering
 */
export const invoiceQuerySchema = z.object({
  page: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).max(100).default(10)
  ),
  status: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
    z.enum(BILL_STATUS_LIST).optional()
  ),
  patientId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['issuedDate', 'dueDate', 'totalAmount', 'dueAmount', 'createdAt']).default('createdAt'),
  sortOrder: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.enum(['asc', 'desc']).default('desc')
  )
});

/**
 * UUID route parameter schema
 */
export const invoiceIdParamSchema = z.object({
  id: z.string().uuid('Invalid Invoice ID format')
});

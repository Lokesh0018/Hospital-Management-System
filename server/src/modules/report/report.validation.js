import { z } from 'zod';

/**
 * Supported Medical Report Types
 */
export const REPORT_TYPES = [
  'X-Ray',
  'MRI',
  'CT Scan',
  'Blood Test',
  'ECG',
  'Other'
];

/**
 * Medical Report Status Lifecycle
 */
export const REPORT_STATUS = Object.freeze({
  UPLOADED: 'UPLOADED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  REVIEWED: 'REVIEWED'
});

export const REPORT_STATUS_LIST = Object.values(REPORT_STATUS);

/**
 * Helper to normalize reportType with case-insensitive matching
 */
const reportTypeSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const match = REPORT_TYPES.find((t) => t.toLowerCase() === trimmed.toLowerCase());
    return match || trimmed;
  }
  return val;
}, z.enum(REPORT_TYPES, {
  errorMap: () => ({
    message: `Report type must be one of: ${REPORT_TYPES.join(', ')}`
  })
}));

/**
 * Helper to normalize status with case-insensitive matching
 */
const reportStatusSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const formatted = val.trim().toUpperCase().replace(/\s+/g, '_');
    return formatted;
  }
  return val;
}, z.enum(REPORT_STATUS_LIST, {
  errorMap: () => ({
    message: `Status must be one of: ${REPORT_STATUS_LIST.join(', ')} (or Uploaded, Under Review, Reviewed)`
  })
}));

/**
 * Schema for uploading / creating medical report metadata
 */
export const createReportSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().max(1000).optional(),
  reportType: reportTypeSchema,
  fileUrl: z.string().trim().optional(),
  fileType: z.string().trim().max(100).optional(),
  fileSize: z.number().int().min(0).optional(),
  reportDate: z.string().trim().optional(),
  patientId: z.string().trim().optional(), // Required for staff, auto-resolved for self-uploading patients
  doctorId: z.string().trim().optional()   // Optional doctor assignment
});

/**
 * Schema for updating medical report metadata
 */
export const updateReportSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  reportType: reportTypeSchema.optional(),
  fileUrl: z.string().trim().optional(),
  fileType: z.string().trim().max(100).optional(),
  fileSize: z.number().int().min(0).optional(),
  reportDate: z.string().trim().optional(),
  doctorId: z.string().trim().nullable().optional(),
  status: reportStatusSchema.optional()
});

/**
 * Schema for Doctor reviewing report and adding clinical notes
 */
export const reviewReportSchema = z.object({
  doctorNotes: z
    .string()
    .trim()
    .min(1, 'Doctor clinical notes/findings are required')
    .max(5000, 'Notes cannot exceed 5000 characters'),
  status: reportStatusSchema.default(REPORT_STATUS.REVIEWED)
});

/**
 * Schema for query filters & pagination when listing reports
 */
export const reportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  reportType: reportTypeSchema.optional(),
  status: reportStatusSchema.optional(),
  patientId: z.string().trim().optional(),
  doctorId: z.string().trim().optional(),
  assignedToMe: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  sortBy: z.enum(['reportDate', 'createdAt', 'title']).default('reportDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Schema for route parameters containing Report ID
 */
export const reportIdParamSchema = z.object({
  id: z.string().min(1, 'Report ID is required')
});

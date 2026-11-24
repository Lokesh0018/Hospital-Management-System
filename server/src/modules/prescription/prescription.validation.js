import { z } from 'zod';

/**
 * Prescription Status Lifecycle
 */
export const PRESCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

export const PRESCRIPTION_STATUS_LIST = Object.values(PRESCRIPTION_STATUS);

/**
 * Helper to normalize status with case-insensitivity
 */
const prescriptionStatusSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(PRESCRIPTION_STATUS_LIST, {
    errorMap: () => ({
      message: `Status must be one of: ${PRESCRIPTION_STATUS_LIST.join(', ')}`
    })
  })
);

/**
 * Schema for an individual prescribed medicine item
 */
export const medicineItemSchema = z.object({
  medicineName: z
    .string()
    .trim()
    .min(1, 'Medicine name is required')
    .max(200, 'Medicine name cannot exceed 200 characters'),
  dosage: z
    .string()
    .trim()
    .min(1, 'Dosage is required (e.g. 500mg, 1 tablet, 10ml)')
    .max(100),
  frequency: z
    .string()
    .trim()
    .min(1, 'Frequency is required (e.g. Twice daily, Every 8 hours)')
    .max(100),
  duration: z
    .string()
    .trim()
    .min(1, 'Duration is required (e.g. 5 days, 2 weeks)')
    .max(100),
  instructions: z.string().trim().max(500).optional()
});

/**
 * Schema for creating a new Prescription
 * Allows an array of medicines, or pre-processes flat medicine fields into the medicines array
 */
export const createPrescriptionSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !val.medicines && val.medicineName) {
    return {
      ...val,
      medicines: [
        {
          medicineName: val.medicineName,
          dosage: val.dosage,
          frequency: val.frequency,
          duration: val.duration,
          instructions: val.instructions
        }
      ]
    };
  }
  return val;
}, z.object({
  patientId: z.string().trim().min(1, 'Patient ID is required'),
  doctorId: z.string().trim().optional(), // Auto-resolved if created by a doctor
  appointmentId: z.string().trim().optional(), // Optional appointment link
  reportId: z.string().trim().optional(),      // Optional medical report link
  diagnosis: z
    .string()
    .trim()
    .min(2, 'Diagnosis must be at least 2 characters')
    .max(500, 'Diagnosis cannot exceed 500 characters'),
  instructions: z.string().trim().max(1000).optional(),
  medicines: z
    .array(medicineItemSchema)
    .min(1, 'Prescription must contain at least one prescribed medicine')
}));

/**
 * Schema for updating an existing Prescription
 */
export const updatePrescriptionSchema = z.object({
  diagnosis: z.string().trim().min(2).max(500).optional(),
  instructions: z.string().trim().max(1000).optional(),
  status: prescriptionStatusSchema.optional(),
  medicines: z.array(medicineItemSchema).min(1).optional()
});

/**
 * Schema for directly updating prescription status
 */
export const updateStatusSchema = z.object({
  status: prescriptionStatusSchema
});

/**
 * Schema for query filters & pagination when listing prescriptions
 */
export const prescriptionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: prescriptionStatusSchema.optional(),
  patientId: z.string().trim().optional(),
  doctorId: z.string().trim().optional(),
  appointmentId: z.string().trim().optional(),
  reportId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['createdAt', 'diagnosis']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Schema for route parameters containing Prescription ID
 */
export const prescriptionIdParamSchema = z.object({
  id: z.string().min(1, 'Prescription ID is required')
});

import { z } from 'zod';

/**
 * Supported Doctor Specializations as specified in HMS requirements
 */
export const DOCTOR_SPECIALIZATIONS = [
  'Cardiologist',
  'Dentist',
  'Neurologist',
  'Dermatologist',
  'Orthopedic',
  'General Physician'
];

/**
 * Standard Doctor Availability Status values
 */
export const AVAILABILITY_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  ON_LEAVE: 'ON_LEAVE',
  BUSY: 'BUSY'
});

export const AVAILABILITY_STATUS_LIST = Object.values(AVAILABILITY_STATUS);

/**
 * Helper to normalize availableDays if provided as array or string
 */
const availableDaysSchema = z
  .union([
    z.string().trim(),
    z.array(z.string().trim()).transform((days) => days.join(','))
  ])
  .optional();

/**
 * Schema for creating a new doctor (Admin)
 * Creates both the base User account and the DoctorProfile
 */
export const createDoctorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address format')
    .toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().trim().optional(),
  specialization: z.enum(DOCTOR_SPECIALIZATIONS, {
    errorMap: () => ({
      message: `Specialization must be one of: ${DOCTOR_SPECIALIZATIONS.join(', ')}`
    })
  }),
  department: z.string().trim().min(2, 'Department must be at least 2 characters').max(100).optional(),
  qualification: z.string().trim().max(200).optional(),
  experienceYears: z
    .number()
    .int('Experience years must be an integer')
    .min(0, 'Experience years cannot be negative')
    .max(70, 'Experience years cannot exceed 70')
    .default(0),
  consultationFee: z
    .number()
    .min(0, 'Consultation fee cannot be negative')
    .default(0.0),
  availableDays: availableDaysSchema,
  availabilityStatus: z
    .enum(AVAILABILITY_STATUS_LIST, {
      errorMap: () => ({
        message: `Availability status must be one of: ${AVAILABILITY_STATUS_LIST.join(', ')}`
      })
    })
    .default(AVAILABILITY_STATUS.AVAILABLE)
});

/**
 * Schema for updating a doctor (Admin)
 */
export const updateDoctorSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  specialization: z
    .enum(DOCTOR_SPECIALIZATIONS, {
      errorMap: () => ({
        message: `Specialization must be one of: ${DOCTOR_SPECIALIZATIONS.join(', ')}`
      })
    })
    .optional(),
  department: z.string().trim().min(2).max(100).optional(),
  qualification: z.string().trim().max(200).optional(),
  experienceYears: z
    .number()
    .int()
    .min(0, 'Experience years cannot be negative')
    .max(70)
    .optional(),
  consultationFee: z
    .number()
    .min(0, 'Consultation fee cannot be negative')
    .optional(),
  availableDays: availableDaysSchema,
  availabilityStatus: z
    .enum(AVAILABILITY_STATUS_LIST, {
      errorMap: () => ({
        message: `Availability status must be one of: ${AVAILABILITY_STATUS_LIST.join(', ')}`
      })
    })
    .optional()
});

/**
 * Schema for a doctor updating their own profile
 */
export const updateDoctorProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  specialization: z
    .enum(DOCTOR_SPECIALIZATIONS, {
      errorMap: () => ({
        message: `Specialization must be one of: ${DOCTOR_SPECIALIZATIONS.join(', ')}`
      })
    })
    .optional(),
  department: z.string().trim().min(2).max(100).optional(),
  qualification: z.string().trim().max(200).optional(),
  experienceYears: z
    .number()
    .int()
    .min(0)
    .max(70)
    .optional(),
  consultationFee: z
    .number()
    .min(0)
    .optional(),
  availableDays: availableDaysSchema,
  availabilityStatus: z
    .enum(AVAILABILITY_STATUS_LIST, {
      errorMap: () => ({
        message: `Availability status must be one of: ${AVAILABILITY_STATUS_LIST.join(', ')}`
      })
    })
    .optional()
});

/**
 * Schema for updating doctor availability status
 */
export const updateStatusSchema = z.object({
  availabilityStatus: z.enum(AVAILABILITY_STATUS_LIST, {
    errorMap: () => ({
      message: `Availability status must be one of: ${AVAILABILITY_STATUS_LIST.join(', ')}`
    })
  })
});

/**
 * Schema for query filters & pagination when listing doctors
 */
export const doctorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
  search: z.string().trim().optional(),
  specialization: z.enum(DOCTOR_SPECIALIZATIONS).optional(),
  department: z.string().trim().optional(),
  availabilityStatus: z.enum(AVAILABILITY_STATUS_LIST).optional(),
  sortBy: z.enum(['name', 'experienceYears', 'consultationFee', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Schema for route parameters containing ID
 */
export const doctorIdParamSchema = z.object({
  id: z.string().min(1, 'Doctor ID is required')
});

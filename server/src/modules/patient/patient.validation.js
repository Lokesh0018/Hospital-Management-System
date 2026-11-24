import { z } from 'zod';

/**
 * Standard Blood Groups supported in Hospital Management System
 */
export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-'
];

/**
 * Standard Gender values
 */
export const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

/**
 * Helper to normalize gender input
 */
const genderSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(GENDERS, {
    errorMap: () => ({ message: `Gender must be one of: ${GENDERS.join(', ')}` })
  })
);

/**
 * Helper to normalize blood group input
 */
const bloodGroupSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(BLOOD_GROUPS, {
    errorMap: () => ({ message: `Blood group must be one of: ${BLOOD_GROUPS.join(', ')}` })
  })
);

/**
 * Helper to validate Date of Birth
 * Must be a valid date in the past and within realistic lifespan (<= 130 years)
 */
const dateOfBirthSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) return false;
      const today = new Date();
      if (parsed > today) return false;
      const earliest = new Date();
      earliest.setFullYear(earliest.getFullYear() - 130);
      return parsed >= earliest;
    },
    { message: 'Date of birth must be a valid date in the past (YYYY-MM-DD)' }
  );

/**
 * Schema for creating a new Patient (Admin or Receptionist)
 */
export const createPatientSchema = z.object({
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
  gender: genderSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  bloodGroup: bloodGroupSchema.optional(),
  emergencyContact: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
  medicalHistory: z.string().trim().max(5000).optional()
});

/**
 * Schema for updating an existing Patient (Admin or Receptionist)
 */
export const updatePatientSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  gender: genderSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  bloodGroup: bloodGroupSchema.optional(),
  emergencyContact: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
  medicalHistory: z.string().trim().max(5000).optional()
});

/**
 * Schema for self-service Profile update by Patient
 */
export const updatePatientProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  gender: genderSchema.optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  bloodGroup: bloodGroupSchema.optional(),
  emergencyContact: z.string().trim().max(100).optional(),
  address: z.string().trim().max(300).optional(),
  medicalHistory: z.string().trim().max(5000).optional()
});

/**
 * Schema for updating or appending to Medical History
 */
export const updateMedicalHistorySchema = z.object({
  medicalHistory: z.string().trim().min(1, 'Medical history content is required').max(5000),
  append: z.boolean().default(false)
});

/**
 * Schema for query filters & pagination when listing patients
 */
export const patientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(10),
  search: z.string().trim().optional(),
  gender: genderSchema.optional(),
  bloodGroup: bloodGroupSchema.optional(),
  sortBy: z.enum(['name', 'createdAt', 'dateOfBirth']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * Schema for route parameters containing Patient ID
 */
export const patientIdParamSchema = z.object({
  id: z.string().min(1, 'Patient ID is required')
});

import { z } from 'zod';
import { ALL_ROLES, ROLES } from '../../constants/roles.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
  email: z.string().trim().email('Invalid email address format').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(ALL_ROLES, {
    errorMap: () => ({ message: `Role must be one of: ${ALL_ROLES.join(', ')}` })
  }).default(ROLES.PATIENT),
  phone: z.string().trim().optional(),
  // Optional profile attributes based on role
  doctorDetails: z.object({
    specialization: z.string().min(2),
    qualification: z.string().optional(),
    department: z.string().optional(),
    experienceYears: z.number().int().min(0).optional(),
    consultationFee: z.number().min(0).optional(),
    availableDays: z.string().optional()
  }).optional(),
  patientDetails: z.object({
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    emergencyContact: z.string().optional(),
    address: z.string().optional(),
    medicalHistory: z.string().optional()
  }).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
});

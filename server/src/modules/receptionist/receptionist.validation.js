import { z } from 'zod';

/**
 * Zod validation schema for receptionist dashboard overview query
 */
export const dashboardQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
});

/**
 * Zod validation schema for daily schedule timeline query
 */
export const scheduleQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  doctorId: z
    .string()
    .uuid('Doctor ID must be a valid UUID')
    .optional()
});

/**
 * Zod validation schema for front-desk patient intake
 */
export const patientIntakeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().default('PatientPassword123'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  dateOfBirth: z.string().optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  emergencyContact: z.string().optional(),
  address: z.string().optional(),
  medicalHistory: z.string().optional()
});

/**
 * Zod validation schema for front-desk appointment booking
 */
export const frontDeskBookingSchema = z.object({
  patientId: z.string().uuid('Patient ID must be a valid UUID'),
  doctorId: z.string().uuid('Doctor ID must be a valid UUID'),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Appointment date must be YYYY-MM-DD'),
  timeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING'], {
    errorMap: () => ({ message: 'Time slot must be MORNING, AFTERNOON, or EVENING' })
  }),
  reason: z.string().max(500).optional().default('Front-desk booking')
});

/**
 * Zod validation schema for appointment check-in
 */
export const checkInSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED', 'CANCELLED']).default('CONFIRMED')
});

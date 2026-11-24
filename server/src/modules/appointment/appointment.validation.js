import { z } from 'zod';

/**
 * Appointment Status Lifecycle values
 */
export const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
});

export const APPOINTMENT_STATUS_LIST = Object.values(APPOINTMENT_STATUS);

/**
 * Supported Hospital Appointment Time Slots
 */
export const TIME_SLOTS = Object.freeze({
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING'
});

export const TIME_SLOT_LIST = Object.values(TIME_SLOTS);

/**
 * Time Slot Display Metadata with typical clinic hours
 */
export const TIME_SLOT_DETAILS = {
  [TIME_SLOTS.MORNING]: { label: 'Morning', hours: '09:00 AM - 12:00 PM' },
  [TIME_SLOTS.AFTERNOON]: { label: 'Afternoon', hours: '02:00 PM - 05:00 PM' },
  [TIME_SLOTS.EVENING]: { label: 'Evening', hours: '06:00 PM - 09:00 PM' }
};

/**
 * Helper to normalize slot input (e.g. 'morning' -> 'MORNING')
 */
const timeSlotSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(TIME_SLOT_LIST, {
    errorMap: () => ({
      message: `Time slot must be one of: ${TIME_SLOT_LIST.join(', ')} (or Morning, Afternoon, Evening)`
    })
  })
);

/**
 * Helper to normalize status input
 */
const appointmentStatusSchema = z.preprocess(
  (val) => (typeof val === 'string' ? val.trim().toUpperCase() : val),
  z.enum(APPOINTMENT_STATUS_LIST, {
    errorMap: () => ({
      message: `Status must be one of: ${APPOINTMENT_STATUS_LIST.join(', ')}`
    })
  })
);

/**
 * Helper to validate appointment date (cannot be in the past)
 */
const appointmentDateSchema = z
  .string({ required_error: 'Appointment date is required' })
  .trim()
  .refine(
    (val) => {
      const parsed = new Date(val);
      if (isNaN(parsed.getTime())) return false;
      // Compare with start of today (UTC or local)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appointmentDay = new Date(parsed);
      appointmentDay.setHours(0, 0, 0, 0);
      return appointmentDay >= today;
    },
    { message: 'Appointment date must be a valid future or current date (YYYY-MM-DD)' }
  );

/**
 * Schema for booking an appointment
 */
export const bookAppointmentSchema = z.object({
  doctorId: z.string().trim().min(1, 'Doctor ID is required'),
  appointmentDate: appointmentDateSchema,
  timeSlot: timeSlotSchema,
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
  patientId: z.string().trim().optional() // Only required if Admin or Receptionist is booking on behalf of patient
});

/**
 * Schema for updating an existing appointment
 */
export const updateAppointmentSchema = z.object({
  appointmentDate: appointmentDateSchema.optional(),
  timeSlot: timeSlotSchema.optional(),
  status: appointmentStatusSchema.optional(),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional()
});

/**
 * Schema for updating appointment status directly
 */
export const updateStatusSchema = z.object({
  status: appointmentStatusSchema,
  notes: z.string().trim().max(1000).optional()
});

/**
 * Schema for cancelling an appointment
 */
export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().trim().max(500).optional()
});

/**
 * Schema for query filters & pagination when listing appointments
 */
export const appointmentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: appointmentStatusSchema.optional(),
  timeSlot: timeSlotSchema.optional(),
  date: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  doctorId: z.string().trim().optional(),
  patientId: z.string().trim().optional(),
  sortBy: z.enum(['appointmentDate', 'createdAt']).default('appointmentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

/**
 * Schema for doctor availability check query
 */
export const doctorAvailabilityQuerySchema = z.object({
  date: z.string().trim().min(1, 'Date parameter is required (YYYY-MM-DD)')
});

/**
 * Schema for route parameters containing appointment ID
 */
export const appointmentIdParamSchema = z.object({
  id: z.string().min(1, 'Appointment ID is required')
});

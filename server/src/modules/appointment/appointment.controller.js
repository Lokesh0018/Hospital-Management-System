import { AppointmentService } from './appointment.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import {
  APPOINTMENT_STATUS_LIST,
  TIME_SLOT_LIST,
  TIME_SLOT_DETAILS
} from './appointment.validation.js';

export class AppointmentController {
  /**
   * Book a new appointment (Patient or Admin)
   */
  static async bookAppointment(req, res, next) {
    try {
      const appointment = await AppointmentService.bookAppointment(req.user, req.body);
      return ApiResponse.created(res, appointment, 'Appointment booked successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all appointments with filtering and role-based access rules
   */
  static async getAllAppointments(req, res, next) {
    try {
      const result = await AppointmentService.getAllAppointments(req.user, req.query);
      return ApiResponse.ok(res, result, 'Appointments retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single appointment details by ID
   */
  static async getAppointmentById(req, res, next) {
    try {
      const appointment = await AppointmentService.getAppointmentById(req.user, req.params.id);
      return ApiResponse.ok(res, appointment, 'Appointment details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment (reschedule date/slot, reason, notes, status)
   */
  static async updateAppointment(req, res, next) {
    try {
      const updated = await AppointmentService.updateAppointment(req.user, req.params.id, req.body);
      return ApiResponse.ok(res, updated, 'Appointment updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Directly update appointment status (Doctor or Admin)
   */
  static async updateStatus(req, res, next) {
    try {
      const { status, notes } = req.body;
      const updated = await AppointmentService.updateStatus(req.user, req.params.id, status, notes);
      return ApiResponse.ok(res, updated, `Appointment marked as ${status}.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel appointment (Patient, Doctor, or Admin)
   */
  static async cancelAppointment(req, res, next) {
    try {
      const { cancellationReason } = req.body || {};
      const cancelled = await AppointmentService.cancelAppointment(req.user, req.params.id, cancellationReason);
      return ApiResponse.ok(res, cancelled, 'Appointment cancelled successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check time slot availability for a doctor on a specific date
   */
  static async getDoctorSlotAvailability(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const availability = await AppointmentService.getDoctorSlotAvailability(doctorId, date);
      return ApiResponse.ok(res, availability, 'Doctor slot availability retrieved.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve metadata (supported statuses, time slots, hours)
   */
  static async getMetadata(req, res, next) {
    try {
      return ApiResponse.ok(
        res,
        {
          statuses: APPOINTMENT_STATUS_LIST,
          timeSlots: TIME_SLOT_LIST,
          timeSlotDetails: TIME_SLOT_DETAILS
        },
        'Appointment metadata retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }
}

import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';
import {
  APPOINTMENT_STATUS,
  TIME_SLOTS,
  TIME_SLOT_LIST,
  TIME_SLOT_DETAILS
} from './appointment.validation.js';
import { SocketEvents } from '../../socket/socket.events.js';

export class AppointmentService {
  /**
   * Helper: Normalize date string to UTC midnight DateTime
   */
  static normalizeDate(dateInput) {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      throw ApiError.badRequest('Invalid date format provided for appointment.');
    }
    // Return Date object normalized to UTC start of day
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  /**
   * Helper: Formats appointment record for standardized API responses
   */
  static formatAppointmentResponse(apt) {
    if (!apt) return null;

    const dateStr = apt.appointmentDate instanceof Date
      ? apt.appointmentDate.toISOString().split('T')[0]
      : apt.appointmentDate;

    return {
      id: apt.id,
      appointmentDate: dateStr,
      appointmentDateISO: apt.appointmentDate,
      timeSlot: apt.timeSlot,
      timeSlotDetails: TIME_SLOT_DETAILS[apt.timeSlot] || null,
      status: apt.status,
      reason: apt.reason,
      notes: apt.notes,
      doctor: apt.doctor ? {
        id: apt.doctor.id,
        doctorId: apt.doctor.user?.id,
        name: apt.doctor.user?.name,
        email: apt.doctor.user?.email,
        phone: apt.doctor.user?.phone,
        specialization: apt.doctor.specialization,
        department: apt.doctor.department,
        consultationFee: apt.doctor.consultationFee,
        availableDays: apt.doctor.availableDays,
        availabilityStatus: apt.doctor.availabilityStatus
      } : null,
      patient: apt.patient ? {
        id: apt.patient.id,
        patientId: apt.patient.user?.id,
        name: apt.patient.user?.name,
        email: apt.patient.user?.email,
        phone: apt.patient.user?.phone,
        gender: apt.patient.gender,
        bloodGroup: apt.patient.bloodGroup,
        emergencyContact: apt.patient.emergencyContact
      } : null,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt
    };
  }

  /**
   * Helper: Resolve DoctorProfile record from either DoctorProfile.id or Doctor User.id
   */
  static async resolveDoctor(id) {
    // Try finding by DoctorProfile id
    let profile = await prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    // If not found, try finding by Doctor User id
    if (!profile) {
      profile = await prisma.doctorProfile.findFirst({
        where: { userId: id },
        include: { user: true }
      });
    }

    if (!profile || !profile.user || profile.user.role !== ROLES.DOCTOR) {
      throw ApiError.notFound(`Doctor with ID '${id}' was not found.`);
    }

    if (!profile.user.isActive) {
      throw ApiError.badRequest(`Doctor '${profile.user.name}' is currently inactive.`);
    }

    return profile;
  }

  /**
   * Helper: Resolve or auto-initialize PatientProfile from user
   */
  static async resolvePatient(currentUser, requestedPatientId) {
    // If current user is PATIENT, always use their own profile
    if (currentUser.role === ROLES.PATIENT) {
      let profile = await prisma.patientProfile.findUnique({
        where: { userId: currentUser.id },
        include: { user: true }
      });

      if (!profile) {
        profile = await prisma.patientProfile.create({
          data: { userId: currentUser.id },
          include: { user: true }
        });
      }

      return profile;
    }

    // If Admin/Receptionist, use requestedPatientId if provided
    if (requestedPatientId) {
      let profile = await prisma.patientProfile.findUnique({
        where: { id: requestedPatientId },
        include: { user: true }
      });

      if (!profile) {
        profile = await prisma.patientProfile.findFirst({
          where: { userId: requestedPatientId },
          include: { user: true }
        });
      }

      if (!profile) {
        throw ApiError.notFound(`Patient with ID '${requestedPatientId}' was not found.`);
      }

      return profile;
    }

    throw ApiError.badRequest('Patient ID is required when booking as an administrator.');
  }

  /**
   * Helper: Check doctor day availability and status
   */
  static validateDoctorAvailability(doctor, appointmentDate) {
    // 1. Doctor Status Check: Available, Busy, On Leave
    const status = doctor.availabilityStatus || 'AVAILABLE';
    if (status === 'ON_LEAVE') {
      throw ApiError.badRequest(
        `Doctor ${doctor.user.name} is currently ON LEAVE and cannot accept new appointments.`
      );
    }
    if (status === 'UNAVAILABLE' || status === 'BUSY') {
      throw ApiError.badRequest(
        `Doctor ${doctor.user.name} is currently ${status} and cannot accept new appointments.`
      );
    }

    // 2. Doctor Available Days Check (if configured)
    if (doctor.availableDays) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const appointmentDayName = dayNames[appointmentDate.getUTCDay()];

      const configuredDays = doctor.availableDays
        .split(',')
        .map((d) => d.trim().toLowerCase());

      const isDayAvailable = configuredDays.some(
        (cd) =>
          appointmentDayName.toLowerCase().startsWith(cd) ||
          cd.startsWith(appointmentDayName.toLowerCase().slice(0, 3))
      );

      if (!isDayAvailable) {
        throw ApiError.badRequest(
          `Doctor ${doctor.user.name} does not take appointments on ${appointmentDayName}s. Available days: ${doctor.availableDays}`
        );
      }
    }
  }

  /**
   * 1. Book Appointment
   * Enforces doctor availability, time slot validity, and prevents double booking
   */
  static async bookAppointment(currentUser, data) {
    const { doctorId, appointmentDate, timeSlot, reason, patientId } = data;

    // Resolve doctor and patient entities
    const doctor = await this.resolveDoctor(doctorId);
    const patient = await this.resolvePatient(currentUser, patientId);

    // Normalize date to UTC midnight
    const normalizedDate = this.normalizeDate(appointmentDate);

    // Validate doctor availability (status and working days)
    this.validateDoctorAvailability(doctor, normalizedDate);

    // Atomically check double-booking and create appointment
    const createdAppointment = await prisma.$transaction(async (tx) => {
      // Check if an active appointment already exists for this doctor, date, and slot
      const existingBooking = await tx.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          appointmentDate: normalizedDate,
          timeSlot: timeSlot.toUpperCase(),
          status: {
            in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]
          }
        }
      });

      if (existingBooking) {
        throw ApiError.conflict(
          `Doctor ${doctor.user.name} already has a booking for the ${timeSlot} slot on this date. Double booking is prevented. Please choose another time slot or date.`
        );
      }

      // Check if this patient already has an appointment in the same slot on the same day
      const patientDoubleBooking = await tx.appointment.findFirst({
        where: {
          patientId: patient.id,
          appointmentDate: normalizedDate,
          timeSlot: timeSlot.toUpperCase(),
          status: {
            in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED]
          }
        }
      });

      if (patientDoubleBooking) {
        throw ApiError.conflict(
          `Patient already has an active appointment in the ${timeSlot} slot on this date.`
        );
      }

      return tx.appointment.create({
        data: {
          doctorId: doctor.id,
          patientId: patient.id,
          userId: currentUser.id,
          appointmentDate: normalizedDate,
          timeSlot: timeSlot.toUpperCase(),
          status: APPOINTMENT_STATUS.PENDING,
          reason: reason || null
        },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        }
      });
    });

    const response = this.formatAppointmentResponse(createdAppointment);
    SocketEvents.appointmentCreated(response).catch((err) =>
      console.error('[Socket.IO] Error emitting appointmentCreated:', err)
    );
    return response;
  }

  /**
   * 2. View Appointments with filtering, search, and RBAC visibility rules
   */
  static async getAllAppointments(currentUser, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      timeSlot,
      date,
      startDate,
      endDate,
      doctorId,
      patientId,
      sortBy = 'appointmentDate',
      sortOrder = 'asc'
    } = queryParams;

    const skip = (page - 1) * limit;
    const where = {};

    // RBAC Filter: Restrict view based on user role
    if (currentUser.role === ROLES.PATIENT) {
      where.patient = { userId: currentUser.id };
    } else if (currentUser.role === ROLES.DOCTOR) {
      where.doctor = { userId: currentUser.id };
    } else if (currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.RECEPTIONIST) {
      // Admins & Receptionists can filter by doctorId or patientId
      if (doctorId) {
        where.OR = [
          { doctorId },
          { doctor: { userId: doctorId } }
        ];
      }
      if (patientId) {
        where.OR = [
          { patientId },
          { patient: { userId: patientId } }
        ];
      }
    }

    // Status filter
    if (status) {
      where.status = status.toUpperCase();
    }

    // Time slot filter
    if (timeSlot) {
      where.timeSlot = timeSlot.toUpperCase();
    }

    // Date filters
    if (date) {
      where.appointmentDate = this.normalizeDate(date);
    } else if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) where.appointmentDate.gte = this.normalizeDate(startDate);
      if (endDate) where.appointmentDate.lte = this.normalizeDate(endDate);
    }

    const orderBy = { [sortBy]: sortOrder };

    const [total, appointments] = await prisma.$transaction([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        },
        skip,
        take: limit,
        orderBy
      })
    ]);

    return {
      appointments: appointments.map((apt) => this.formatAppointmentResponse(apt)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * View single appointment by ID with role authorization
   */
  static async getAppointmentById(currentUser, id) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    if (!appointment) {
      throw ApiError.notFound(`Appointment with ID '${id}' was not found.`);
    }

    // RBAC Authorization check
    if (currentUser.role === ROLES.PATIENT && appointment.patient.userId !== currentUser.id) {
      throw ApiError.forbidden('You are not authorized to view this appointment.');
    }

    if (currentUser.role === ROLES.DOCTOR && appointment.doctor.userId !== currentUser.id) {
      throw ApiError.forbidden('You are not authorized to view this appointment.');
    }

    return this.formatAppointmentResponse(appointment);
  }

  /**
   * 3. Update Appointment (Rescheduling, Status, Reason, Clinical Notes)
   */
  static async updateAppointment(currentUser, id, data) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    if (!appointment) {
      throw ApiError.notFound(`Appointment with ID '${id}' was not found.`);
    }

    // Role-based permission & action validation
    const isPatient = currentUser.role === ROLES.PATIENT && appointment.patient.userId === currentUser.id;
    const isDoctor = currentUser.role === ROLES.DOCTOR && appointment.doctor.userId === currentUser.id;
    const isAdmin = currentUser.role === ROLES.ADMIN;
    const isStaff = isAdmin || currentUser.role === ROLES.RECEPTIONIST;

    if (!isPatient && !isDoctor && !isStaff) {
      throw ApiError.forbidden('You are not authorized to update this appointment.');
    }

    // Patients cannot modify completed or cancelled appointments
    if (isPatient && (appointment.status === APPOINTMENT_STATUS.COMPLETED || appointment.status === APPOINTMENT_STATUS.CANCELLED)) {
      throw ApiError.badRequest(`Cannot modify an appointment that is already ${appointment.status.toLowerCase()}.`);
    }

    const { appointmentDate, timeSlot, status, reason, notes } = data;
    const updateData = {};

    // Doctor notes & status update
    if (notes !== undefined) {
      if (!isDoctor && !isAdmin) {
        throw ApiError.forbidden('Only the assigned doctor or administrator can add clinical notes.');
      }
      updateData.notes = notes;
    }

    if (status !== undefined) {
      if (isPatient && status !== APPOINTMENT_STATUS.CANCELLED) {
        throw ApiError.forbidden('Patients can only request cancellation, not change appointment status directly.');
      }
      updateData.status = status.toUpperCase();
    }

    if (reason !== undefined) {
      updateData.reason = reason;
    }

    // Handle rescheduling: appointmentDate or timeSlot
    const newDate = appointmentDate ? this.normalizeDate(appointmentDate) : appointment.appointmentDate;
    const newSlot = timeSlot ? timeSlot.toUpperCase() : appointment.timeSlot;

    const isRescheduling = appointmentDate !== undefined || timeSlot !== undefined;

    if (isRescheduling) {
      // Validate doctor availability on new date
      this.validateDoctorAvailability(appointment.doctor, newDate);

      // Check double-booking for the doctor in transaction
      return await prisma.$transaction(async (tx) => {
        const doubleBooking = await tx.appointment.findFirst({
          where: {
            doctorId: appointment.doctorId,
            appointmentDate: newDate,
            timeSlot: newSlot,
            status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
            NOT: { id: appointment.id }
          }
        });

        if (doubleBooking) {
          throw ApiError.conflict(
            `Doctor ${appointment.doctor.user.name} already has a booking for ${newSlot} on this date. Reschedule cancelled.`
          );
        }

        updateData.appointmentDate = newDate;
        updateData.timeSlot = newSlot;

        const updated = await tx.appointment.update({
          where: { id },
          data: updateData,
          include: {
            doctor: { include: { user: true } },
            patient: { include: { user: true } }
          }
        });

        const formatted = this.formatAppointmentResponse(updated);
        SocketEvents.appointmentRescheduled(formatted).catch((err) =>
          console.error('[Socket.IO] Error emitting appointmentRescheduled:', err)
        );
        return formatted;
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    const response = this.formatAppointmentResponse(updated);
    if (updated.status === APPOINTMENT_STATUS.CONFIRMED) {
      SocketEvents.appointmentConfirmed(response).catch((err) =>
        console.error('[Socket.IO] Error emitting appointmentConfirmed:', err)
      );
    } else if (updated.status === APPOINTMENT_STATUS.COMPLETED) {
      SocketEvents.appointmentCompleted(response).catch((err) =>
        console.error('[Socket.IO] Error emitting appointmentCompleted:', err)
      );
    } else if (updated.status === APPOINTMENT_STATUS.CANCELLED) {
      SocketEvents.appointmentCancelled(response).catch((err) =>
        console.error('[Socket.IO] Error emitting appointmentCancelled:', err)
      );
    }

    return response;
  }

  /**
   * 4. Cancel Appointment
   */
  static async cancelAppointment(currentUser, id, cancellationReason) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    if (!appointment) {
      throw ApiError.notFound(`Appointment with ID '${id}' was not found.`);
    }

    // Role check: Patient can cancel their own, Doctor can cancel assigned, Admin can cancel any
    const isPatient = currentUser.role === ROLES.PATIENT && appointment.patient.userId === currentUser.id;
    const isDoctor = currentUser.role === ROLES.DOCTOR && appointment.doctor.userId === currentUser.id;
    const isStaff = currentUser.role === ROLES.ADMIN || currentUser.role === ROLES.RECEPTIONIST;

    if (!isPatient && !isDoctor && !isStaff) {
      throw ApiError.forbidden('You are not authorized to cancel this appointment.');
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      throw ApiError.badRequest('This appointment is already cancelled.');
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      throw ApiError.badRequest('Completed appointments cannot be cancelled.');
    }

    const updatedNotes = cancellationReason
      ? `${appointment.notes ? appointment.notes + '\n' : ''}[Cancelled by ${currentUser.name} (${currentUser.role})]: ${cancellationReason}`
      : appointment.notes;

    const cancelled = await prisma.appointment.update({
      where: { id },
      data: {
        status: APPOINTMENT_STATUS.CANCELLED,
        notes: updatedNotes
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    const response = this.formatAppointmentResponse(cancelled);
    SocketEvents.appointmentCancelled(response).catch((err) =>
      console.error('[Socket.IO] Error emitting appointmentCancelled:', err)
    );

    return response;
  }

  /**
   * Update Appointment Status directly (Doctor/Admin)
   */
  static async updateStatus(currentUser, id, status, notes) {
    return this.updateAppointment(currentUser, id, { status, notes });
  }

  /**
   * Check Time Slot Availability for a doctor on a specific date (Requirement 6, 7, 8)
   */
  static async getDoctorSlotAvailability(doctorId, dateString) {
    const doctor = await this.resolveDoctor(doctorId);
    const normalizedDate = this.normalizeDate(dateString);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[normalizedDate.getUTCDay()];

    // Check overall doctor availability status
    const doctorStatus = doctor.availabilityStatus || 'AVAILABLE';
    const isDoctorOnLeave = doctorStatus === 'ON_LEAVE';
    const isDoctorUnavailable = doctorStatus === 'UNAVAILABLE' || doctorStatus === 'BUSY';

    // Check configured available days
    let isDayConfigured = true;
    if (doctor.availableDays) {
      const configuredDays = doctor.availableDays
        .split(',')
        .map((d) => d.trim().toLowerCase());

      isDayConfigured = configuredDays.some(
        (cd) =>
          dayOfWeek.toLowerCase().startsWith(cd) ||
          cd.startsWith(dayOfWeek.toLowerCase().slice(0, 3))
      );
    }

    // Query all non-cancelled appointments for this doctor on this day
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: normalizedDate,
        status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] }
      },
      select: {
        id: true,
        timeSlot: true,
        status: true
      }
    });

    const bookedSlotsMap = new Map();
    bookedAppointments.forEach((apt) => {
      bookedSlotsMap.set(apt.timeSlot, apt.status);
    });

    const slots = TIME_SLOT_LIST.map((slotKey) => {
      const isBooked = bookedSlotsMap.has(slotKey);
      let isAvailable = true;
      let reason = 'Available for booking';

      if (isDoctorOnLeave) {
        isAvailable = false;
        reason = `Doctor is ON LEAVE on this date`;
      } else if (isDoctorUnavailable) {
        isAvailable = false;
        reason = `Doctor status is ${doctorStatus}`;
      } else if (!isDayConfigured) {
        isAvailable = false;
        reason = `Doctor does not work on ${dayOfWeek}s`;
      } else if (isBooked) {
        isAvailable = false;
        reason = `Slot already booked (${bookedSlotsMap.get(slotKey).toLowerCase()})`;
      }

      return {
        timeSlot: slotKey,
        hours: TIME_SLOT_DETAILS[slotKey].hours,
        isAvailable,
        bookingStatus: isBooked ? bookedSlotsMap.get(slotKey) : 'OPEN',
        reason
      };
    });

    return {
      doctor: {
        id: doctor.id,
        doctorId: doctor.user?.id,
        name: doctor.user?.name,
        specialization: doctor.specialization,
        department: doctor.department,
        consultationFee: doctor.consultationFee,
        availabilityStatus: doctorStatus,
        availableDays: doctor.availableDays
      },
      queryDate: normalizedDate.toISOString().split('T')[0],
      dayOfWeek,
      isDayAvailable: isDayConfigured && !isDoctorOnLeave && !isDoctorUnavailable,
      slots
    };
  }
}

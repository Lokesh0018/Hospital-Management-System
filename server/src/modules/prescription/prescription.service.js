import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';
import { PRESCRIPTION_STATUS } from './prescription.validation.js';
import { SocketEvents } from '../../socket/socket.events.js';

export class PrescriptionService {
  /**
   * Helper: Formats prescription database record for standardized API responses
   */
  static formatPrescriptionResponse(rx) {
    if (!rx) return null;

    return {
      id: rx.id,
      diagnosis: rx.diagnosis,
      instructions: rx.instructions,
      status: rx.status,
      medicines: (rx.medicines || []).map((med) => ({
        id: med.id,
        medicineName: med.medicineName,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions
      })),
      patient: rx.patient ? {
        id: rx.patient.id,
        patientId: rx.patient.user?.id,
        name: rx.patient.user?.name,
        email: rx.patient.user?.email,
        phone: rx.patient.user?.phone,
        gender: rx.patient.gender,
        bloodGroup: rx.patient.bloodGroup,
        emergencyContact: rx.patient.emergencyContact
      } : null,
      doctor: rx.doctor ? {
        id: rx.doctor.id,
        doctorId: rx.doctor.user?.id,
        name: rx.doctor.user?.name,
        email: rx.doctor.user?.email,
        phone: rx.doctor.user?.phone,
        specialization: rx.doctor.specialization,
        department: rx.doctor.department
      } : null,
      appointment: rx.appointment ? {
        id: rx.appointment.id,
        appointmentDate: rx.appointment.appointmentDate instanceof Date
          ? rx.appointment.appointmentDate.toISOString().split('T')[0]
          : rx.appointment.appointmentDate,
        timeSlot: rx.appointment.timeSlot,
        status: rx.appointment.status
      } : null,
      report: rx.report ? {
        id: rx.report.id,
        title: rx.report.title,
        reportType: rx.report.reportType,
        status: rx.report.status
      } : null,
      createdAt: rx.createdAt,
      updatedAt: rx.updatedAt
    };
  }

  /**
   * Helper: Resolves DoctorProfile record
   */
  static async resolveDoctor(currentUser, doctorId) {
    if (currentUser.role === ROLES.DOCTOR) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { userId: currentUser.id },
        include: { user: true }
      });
      if (!doctor) {
        throw ApiError.notFound('Doctor profile not found for this account.');
      }
      return doctor;
    }

    if (doctorId) {
      let doctor = await prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { user: true }
      });
      if (!doctor) {
        doctor = await prisma.doctorProfile.findFirst({
          where: { userId: doctorId },
          include: { user: true }
        });
      }
      if (!doctor || !doctor.user || doctor.user.role !== ROLES.DOCTOR) {
        throw ApiError.notFound(`Doctor with ID '${doctorId}' was not found.`);
      }
      return doctor;
    }

    throw ApiError.badRequest('Doctor ID is required when creating a prescription as an administrator.');
  }

  /**
   * Helper: Resolves PatientProfile record
   */
  static async resolvePatient(patientId) {
    let patient = await prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      patient = await prisma.patientProfile.findFirst({
        where: { userId: patientId },
        include: { user: true }
      });
    }

    if (!patient || !patient.user || patient.user.role !== ROLES.PATIENT) {
      throw ApiError.notFound(`Patient with ID '${patientId}' was not found.`);
    }

    return patient;
  }

  /**
   * 1. Doctor creates prescription for a patient (Requirements 1, 2, 3)
   */
  static async createPrescription(currentUser, data) {
    const {
      patientId,
      doctorId,
      appointmentId,
      reportId,
      diagnosis,
      instructions,
      medicines
    } = data;

    // Resolve doctor and patient
    const doctor = await this.resolveDoctor(currentUser, doctorId);
    const patient = await this.resolvePatient(patientId);

    // Verify optional appointment link
    if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });
      if (!appointment) {
        throw ApiError.notFound(`Appointment with ID '${appointmentId}' was not found.`);
      }
    }

    // Verify optional medical report link
    if (reportId) {
      const report = await prisma.medicalReport.findUnique({
        where: { id: reportId }
      });
      if (!report) {
        throw ApiError.notFound(`Medical report with ID '${reportId}' was not found.`);
      }
    }

    // Create prescription with nested medicine items within transaction
    const created = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentId: appointmentId || null,
          reportId: reportId || null,
          diagnosis,
          instructions: instructions || null,
          status: PRESCRIPTION_STATUS.ACTIVE,
          medicines: {
            create: medicines.map((m) => ({
              medicineName: m.medicineName,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              instructions: m.instructions || null
            }))
          }
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          report: true,
          medicines: true
        }
      });

      return rx;
    });

    const response = this.formatPrescriptionResponse(created);
    SocketEvents.prescriptionCreated(response).catch((err) =>
      console.error('[Socket.IO] Error emitting prescriptionCreated:', err)
    );
    return response;
  }

  /**
   * 2. Get All Prescriptions with filtering, search, and RBAC rules (Requirements 4, 5, 6)
   */
  static async getAllPrescriptions(currentUser, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      patientId,
      doctorId,
      appointmentId,
      reportId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (page - 1) * limit;
    const where = {};

    // RBAC rules:
    if (currentUser.role === ROLES.PATIENT) {
      // Patients can only view their own prescriptions
      where.patient = { userId: currentUser.id };
    } else if (currentUser.role === ROLES.DOCTOR) {
      // Doctors see prescriptions created by them, or filtered by patient
      if (patientId) {
        where.OR = [{ patientId }, { patient: { userId: patientId } }];
      } else {
        where.doctor = { userId: currentUser.id };
      }
    } else {
      // Admin sees all, with optional filters
      if (patientId) {
        where.OR = [{ patientId }, { patient: { userId: patientId } }];
      }
      if (doctorId) {
        where.OR = [{ doctorId }, { doctor: { userId: doctorId } }];
      }
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    if (appointmentId) {
      where.appointmentId = appointmentId;
    }

    if (reportId) {
      where.reportId = reportId;
    }

    if (search) {
      where.OR = [
        { diagnosis: { contains: search } },
        { instructions: { contains: search } },
        {
          medicines: {
            some: { medicineName: { contains: search } }
          }
        },
        {
          patient: {
            user: { name: { contains: search } }
          }
        },
        {
          doctor: {
            user: { name: { contains: search } }
          }
        }
      ];
    }

    const orderBy = { [sortBy]: sortOrder };

    const [total, prescriptions] = await prisma.$transaction([
      prisma.prescription.count({ where }),
      prisma.prescription.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          report: true,
          medicines: true
        },
        skip,
        take: limit,
        orderBy
      })
    ]);

    return {
      prescriptions: prescriptions.map((rx) => this.formatPrescriptionResponse(rx)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 3. Get single prescription by ID
   */
  static async getPrescriptionById(currentUser, id) {
    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        appointment: true,
        report: true,
        medicines: true
      }
    });

    if (!rx) {
      throw ApiError.notFound(`Prescription with ID '${id}' was not found.`);
    }

    // RBAC: Patient can only view their own prescription
    if (currentUser.role === ROLES.PATIENT && rx.patient.userId !== currentUser.id) {
      throw ApiError.forbidden('You are not authorized to view this prescription.');
    }

    return this.formatPrescriptionResponse(rx);
  }

  /**
   * 4. Update Prescription details or medicines (Doctor or Admin)
   */
  static async updatePrescription(currentUser, id, data) {
    const rx = await prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });

    if (!rx) {
      throw ApiError.notFound(`Prescription with ID '${id}' was not found.`);
    }

    const isCreatorDoctor = currentUser.role === ROLES.DOCTOR && rx.doctor.userId === currentUser.id;
    const isAdmin = currentUser.role === ROLES.ADMIN;

    if (!isCreatorDoctor && !isAdmin) {
      throw ApiError.forbidden('Only the prescribing doctor or an administrator can update this prescription.');
    }

    const { diagnosis, instructions, status, medicines } = data;
    const updateData = {};

    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updated = await prisma.$transaction(async (tx) => {
      // If new medicines list is provided, replace existing items
      if (medicines && Array.isArray(medicines) && medicines.length > 0) {
        await tx.prescriptionItem.deleteMany({
          where: { prescriptionId: id }
        });

        await tx.prescriptionItem.createMany({
          data: medicines.map((m) => ({
            prescriptionId: id,
            medicineName: m.medicineName,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions || null
          }))
        });
      }

      const updatedRx = await tx.prescription.update({
        where: { id },
        data: updateData,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          appointment: true,
          report: true,
          medicines: true
        }
      });

      return updatedRx;
    });

    const response = this.formatPrescriptionResponse(updated);
    if (updated.status === PRESCRIPTION_STATUS.COMPLETED) {
      SocketEvents.prescriptionCompleted(response).catch((err) =>
        console.error('[Socket.IO] Error emitting prescriptionCompleted:', err)
      );
    } else if (updated.status === PRESCRIPTION_STATUS.CANCELLED) {
      SocketEvents.prescriptionCancelled(response).catch((err) =>
        console.error('[Socket.IO] Error emitting prescriptionCancelled:', err)
      );
    } else {
      SocketEvents.prescriptionUpdated(response).catch((err) =>
        console.error('[Socket.IO] Error emitting prescriptionUpdated:', err)
      );
    }
    return response;
  }

  /**
   * 5. Update Prescription Status directly (Requirement 7: ACTIVE, COMPLETED, CANCELLED)
   */
  static async updateStatus(currentUser, id, status) {
    return this.updatePrescription(currentUser, id, { status });
  }

  /**
   * 6. Delete Prescription (Admin only)
   */
  static async deletePrescription(currentUser, id) {
    const rx = await prisma.prescription.findUnique({
      where: { id }
    });

    if (!rx) {
      throw ApiError.notFound(`Prescription with ID '${id}' was not found.`);
    }

    if (currentUser.role !== ROLES.ADMIN) {
      throw ApiError.forbidden('Only administrators can delete prescriptions.');
    }

    await prisma.prescription.delete({
      where: { id }
    });

    return {
      deletedPrescriptionId: id,
      diagnosis: rx.diagnosis
    };
  }
}

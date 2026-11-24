import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';
import { REPORT_STATUS } from './report.validation.js';
import { SocketEvents } from '../../socket/socket.events.js';

export class ReportService {
  /**
   * Helper: Formats medical report record for standardized API responses
   */
  static formatReportResponse(rep) {
    if (!rep) return null;

    const reportDateStr = rep.reportDate instanceof Date
      ? rep.reportDate.toISOString().split('T')[0]
      : rep.reportDate;

    return {
      id: rep.id,
      title: rep.title,
      description: rep.description,
      reportType: rep.reportType,
      fileUrl: rep.fileUrl,
      fileType: rep.fileType,
      fileSize: rep.fileSize,
      status: rep.status,
      doctorNotes: rep.doctorNotes,
      reviewedAt: rep.reviewedAt,
      reportDate: reportDateStr,
      patient: rep.patient ? {
        id: rep.patient.id,
        patientId: rep.patient.user?.id,
        name: rep.patient.user?.name,
        email: rep.patient.user?.email,
        phone: rep.patient.user?.phone,
        gender: rep.patient.gender,
        bloodGroup: rep.patient.bloodGroup,
        emergencyContact: rep.patient.emergencyContact
      } : null,
      doctor: rep.doctor ? {
        id: rep.doctor.id,
        doctorId: rep.doctor.user?.id,
        name: rep.doctor.user?.name,
        email: rep.doctor.user?.email,
        phone: rep.doctor.user?.phone,
        specialization: rep.doctor.specialization,
        department: rep.doctor.department
      } : null,
      uploadedBy: rep.uploadedBy ? {
        id: rep.uploadedBy.id,
        name: rep.uploadedBy.name,
        email: rep.uploadedBy.email,
        role: rep.uploadedBy.role
      } : null,
      createdAt: rep.createdAt,
      updatedAt: rep.updatedAt
    };
  }

  /**
   * Helper: Resolve PatientProfile from current user or requested ID
   */
  static async resolvePatient(currentUser, requestedPatientId) {
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

    throw ApiError.badRequest('Patient ID is required when uploading a medical report.');
  }

  /**
   * Helper: Resolve DoctorProfile from DoctorProfile.id or Doctor User.id
   */
  static async resolveDoctor(doctorId) {
    if (!doctorId) return null;

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

  /**
   * 1. Create / Upload Medical Report Metadata
   */
  static async createReport(currentUser, data) {
    const {
      title,
      description,
      reportType,
      fileUrl,
      fileType,
      fileSize,
      reportDate,
      patientId,
      doctorId
    } = data;

    const patient = await this.resolvePatient(currentUser, patientId);
    const doctor = doctorId ? await this.resolveDoctor(doctorId) : null;

    const parsedReportDate = reportDate ? new Date(reportDate) : new Date();

    const createdReport = await prisma.medicalReport.create({
      data: {
        title,
        description: description || null,
        reportType,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        reportDate: parsedReportDate,
        status: REPORT_STATUS.UPLOADED,
        patientId: patient.id,
        doctorId: doctor ? doctor.id : null,
        uploadedById: currentUser.id
      },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        uploadedBy: true
      }
    });

    const response = this.formatReportResponse(createdReport);
    SocketEvents.reportUploaded(response).catch((err) =>
      console.error('[Socket.IO] Error emitting reportUploaded:', err)
    );
    return response;
  }

  /**
   * 2. Get All Reports with filtering, search, pagination, and RBAC rules
   */
  static async getAllReports(currentUser, queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      reportType,
      status,
      patientId,
      doctorId,
      assignedToMe,
      sortBy = 'reportDate',
      sortOrder = 'desc'
    } = queryParams;

    const skip = (page - 1) * limit;
    const where = {};

    // RBAC rules:
    if (currentUser.role === ROLES.PATIENT) {
      // Patients can only see their own reports
      where.patient = { userId: currentUser.id };
    } else if (currentUser.role === ROLES.DOCTOR) {
      // Doctor: can see assigned reports or search by patient
      if (assignedToMe) {
        where.doctor = { userId: currentUser.id };
      } else if (doctorId) {
        where.OR = [{ doctorId }, { doctor: { userId: doctorId } }];
      } else if (patientId) {
        where.OR = [{ patientId }, { patient: { userId: patientId } }];
      }
      // If neither specified, doctors see reports assigned to them or general
    } else {
      // Admin, Lab Tech, Receptionist
      if (patientId) {
        where.OR = [{ patientId }, { patient: { userId: patientId } }];
      }
      if (doctorId) {
        where.OR = [{ doctorId }, { doctor: { userId: doctorId } }];
      }
    }

    if (reportType) {
      where.reportType = reportType;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
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

    const [total, reports] = await prisma.$transaction([
      prisma.medicalReport.count({ where }),
      prisma.medicalReport.findMany({
        where,
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
          uploadedBy: true
        },
        skip,
        take: limit,
        orderBy
      })
    ]);

    return {
      reports: reports.map((r) => this.formatReportResponse(r)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 3. Get single report by ID
   */
  static async getReportById(currentUser, id) {
    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        uploadedBy: true
      }
    });

    if (!report) {
      throw ApiError.notFound(`Medical report with ID '${id}' was not found.`);
    }

    // RBAC: Patient cannot view another patient's report
    if (currentUser.role === ROLES.PATIENT && report.patient.userId !== currentUser.id) {
      throw ApiError.forbidden('You are not authorized to view this medical report.');
    }

    return this.formatReportResponse(report);
  }

  /**
   * 4. Update Report metadata / reassign doctor
   */
  static async updateReport(currentUser, id, data) {
    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });

    if (!report) {
      throw ApiError.notFound(`Medical report with ID '${id}' was not found.`);
    }

    // Role check: Only Admin, Lab Technician, Doctor, or uploader can update metadata
    const isOwner = report.uploadedById === currentUser.id;
    const isStaff = [ROLES.ADMIN, ROLES.LAB_TECHNICIAN, ROLES.DOCTOR, ROLES.RECEPTIONIST].includes(currentUser.role);

    if (!isOwner && !isStaff) {
      throw ApiError.forbidden('You are not authorized to update this report.');
    }

    const {
      title,
      description,
      reportType,
      fileUrl,
      fileType,
      fileSize,
      reportDate,
      doctorId,
      status
    } = data;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (reportType !== undefined) updateData.reportType = reportType;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (fileType !== undefined) updateData.fileType = fileType;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (reportDate !== undefined) updateData.reportDate = new Date(reportDate);
    if (status !== undefined) updateData.status = status;

    if (doctorId !== undefined) {
      if (doctorId === null) {
        updateData.doctorId = null;
      } else {
        const doc = await this.resolveDoctor(doctorId);
        updateData.doctorId = doc.id;
      }
    }

    const updated = await prisma.medicalReport.update({
      where: { id },
      data: updateData,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        uploadedBy: true
      }
    });

    return this.formatReportResponse(updated);
  }

  /**
   * 5. Doctor reviews report and adds clinical notes (Requirements 6, 7, 8)
   */
  static async reviewReport(currentUser, id, data) {
    const report = await prisma.medicalReport.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      }
    });

    if (!report) {
      throw ApiError.notFound(`Medical report with ID '${id}' was not found.`);
    }

    // Only DOCTOR or ADMIN can review medical reports
    if (currentUser.role !== ROLES.DOCTOR && currentUser.role !== ROLES.ADMIN) {
      throw ApiError.forbidden('Only qualified doctors or administrators can review medical reports.');
    }

    const { doctorNotes, status } = data;

    const updateData = {
      doctorNotes,
      status: status || REPORT_STATUS.REVIEWED,
      reviewedAt: new Date()
    };

    // If report didn't have an assigned doctor and a doctor is reviewing it, assign them
    if (!report.doctorId && currentUser.role === ROLES.DOCTOR) {
      const docProfile = await prisma.doctorProfile.findUnique({
        where: { userId: currentUser.id }
      });
      if (docProfile) {
        updateData.doctorId = docProfile.id;
      }
    }

    const updated = await prisma.medicalReport.update({
      where: { id },
      data: updateData,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
        uploadedBy: true
      }
    });

    const response = this.formatReportResponse(updated);
    SocketEvents.reportReviewed(response).catch((err) =>
      console.error('[Socket.IO] Error emitting reportReviewed:', err)
    );
    return response;
  }

  /**
   * 6. Get Reports Assigned to logged-in Doctor (Requirement 6)
   */
  static async getAssignedReports(currentUser, queryParams = {}) {
    if (currentUser.role !== ROLES.DOCTOR) {
      throw ApiError.forbidden('Only doctors can access assigned medical reports.');
    }

    return this.getAllReports(currentUser, {
      ...queryParams,
      assignedToMe: true
    });
  }

  /**
   * 7. Delete Medical Report (Admin only)
   */
  static async deleteReport(currentUser, id) {
    const report = await prisma.medicalReport.findUnique({
      where: { id }
    });

    if (!report) {
      throw ApiError.notFound(`Medical report with ID '${id}' was not found.`);
    }

    if (currentUser.role !== ROLES.ADMIN && currentUser.role !== ROLES.LAB_TECHNICIAN) {
      throw ApiError.forbidden('Only administrators or laboratory technicians can delete medical reports.');
    }

    await prisma.medicalReport.delete({
      where: { id }
    });

    SocketEvents.reportDeleted(id, report.patientId).catch((err) =>
      console.error('[Socket.IO] Error emitting reportDeleted:', err)
    );

    return {
      deletedReportId: id,
      title: report.title,
      reportType: report.reportType
    };
  }
}

import prisma from '../../database/prisma.js';

export class AdminService {
  /**
   * Helper: Parse start and end of day in UTC
   */
  static getDayBounds(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    const startOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
    return { startOfDay, endOfDay, dateString: startOfDay.toISOString().split('T')[0] };
  }

  /**
   * Core Dashboard Statistics (Requirements 1 - 10)
   */
  static async getStatistics(query = {}) {
    const { startOfDay, endOfDay, dateString } = this.getDayBounds(query.date);

    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
      totalMedicalReports,
      reportsUnderReview,
      totalPrescriptions,
      activePrescriptions
    ] = await Promise.all([
      // 1. Total Doctors
      prisma.doctorProfile.count(),
      // 2. Total Patients
      prisma.patientProfile.count(),
      // 3. Total Appointments
      prisma.appointment.count(),
      // 4. Today's Appointments
      prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      }),
      // 5. Completed Appointments
      prisma.appointment.count({
        where: { status: 'COMPLETED' }
      }),
      // 6. Pending Appointments
      prisma.appointment.count({
        where: { status: 'PENDING' }
      }),
      // 7. Total Medical Reports
      prisma.medicalReport.count(),
      // 8. Reports Under Review
      prisma.medicalReport.count({
        where: { status: 'UNDER_REVIEW' }
      }),
      // 9. Total Prescriptions
      prisma.prescription.count(),
      // 10. Active Prescriptions
      prisma.prescription.count({
        where: { status: 'ACTIVE' }
      })
    ]);

    return {
      referenceDate: dateString,
      totalDoctors,
      totalPatients,
      totalAppointments,
      todayAppointments,
      completedAppointments,
      pendingAppointments,
      totalMedicalReports,
      reportsUnderReview,
      totalPrescriptions,
      activePrescriptions
    };
  }

  /**
   * 11. Recent Appointments
   */
  static async getRecentAppointments(limit = 5) {
    const appointments = await prisma.appointment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        },
        patient: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        }
      }
    });

    return appointments.map((apt) => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate instanceof Date
        ? apt.appointmentDate.toISOString().split('T')[0]
        : apt.appointmentDate,
      timeSlot: apt.timeSlot,
      status: apt.status,
      reason: apt.reason,
      createdAt: apt.createdAt,
      doctor: apt.doctor ? {
        id: apt.doctor.id,
        name: apt.doctor.user?.name,
        email: apt.doctor.user?.email,
        specialization: apt.doctor.specialization,
        department: apt.doctor.department
      } : null,
      patient: apt.patient ? {
        id: apt.patient.id,
        name: apt.patient.user?.name,
        email: apt.patient.user?.email,
        phone: apt.patient.user?.phone,
        gender: apt.patient.gender
      } : null
    }));
  }

  /**
   * 12. Recent Reports
   */
  static async getRecentReports(limit = 5) {
    const reports = await prisma.medicalReport.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    return reports.map((r) => ({
      id: r.id,
      title: r.title,
      reportType: r.reportType,
      status: r.status,
      reportDate: r.reportDate instanceof Date
        ? r.reportDate.toISOString().split('T')[0]
        : r.reportDate,
      fileUrl: r.fileUrl,
      createdAt: r.createdAt,
      patient: r.patient ? {
        id: r.patient.id,
        name: r.patient.user?.name,
        email: r.patient.user?.email
      } : null,
      doctor: r.doctor ? {
        id: r.doctor.id,
        name: r.doctor.user?.name,
        email: r.doctor.user?.email
      } : null
    }));
  }

  /**
   * 13. Recent Prescriptions
   */
  static async getRecentPrescriptions(limit = 5) {
    const prescriptions = await prisma.prescription.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        medicines: true
      }
    });

    return prescriptions.map((p) => ({
      id: p.id,
      diagnosis: p.diagnosis,
      status: p.status,
      instructions: p.instructions,
      medicinesCount: p.medicines?.length || 0,
      medicines: p.medicines || [],
      createdAt: p.createdAt,
      patient: p.patient ? {
        id: p.patient.id,
        name: p.patient.user?.name,
        email: p.patient.user?.email
      } : null,
      doctor: p.doctor ? {
        id: p.doctor.id,
        name: p.doctor.user?.name,
        email: p.doctor.user?.email
      } : null
    }));
  }

  /**
   * 14. Doctor Count by Specialization
   */
  static async getDoctorCountBySpecialization() {
    const grouped = await prisma.doctorProfile.groupBy({
      by: ['specialization'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    const totalDoctors = grouped.reduce((sum, item) => sum + item._count.id, 0);

    const breakdown = {};
    const list = grouped.map((item) => {
      breakdown[item.specialization] = item._count.id;
      const percentage = totalDoctors > 0
        ? ((item._count.id / totalDoctors) * 100).toFixed(1) + '%'
        : '0%';

      return {
        specialization: item.specialization,
        count: item._count.id,
        percentage
      };
    });

    return {
      totalDoctors,
      breakdown,
      list
    };
  }

  /**
   * 15. Appointment Status Analytics
   */
  static async getAppointmentStatusAnalytics() {
    const [groupedStatus, totalAppointments] = await Promise.all([
      prisma.appointment.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      }),
      prisma.appointment.count()
    ]);

    const statusMap = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0
    };

    groupedStatus.forEach((item) => {
      statusMap[item.status] = item._count.id;
    });

    const list = Object.entries(statusMap).map(([status, count]) => {
      const percentage = totalAppointments > 0
        ? ((count / totalAppointments) * 100).toFixed(1) + '%'
        : '0%';
      return {
        status,
        count,
        percentage
      };
    });

    return {
      totalAppointments,
      breakdown: statusMap,
      list
    };
  }

  /**
   * Full Unified Admin Dashboard (All 15 requirements in a single response)
   */
  static async getDashboardOverview(query = {}) {
    const limit = query.limit || 5;

    const [
      statistics,
      recentAppointments,
      recentReports,
      recentPrescriptions,
      doctorCountBySpecialization,
      appointmentStatusAnalytics
    ] = await Promise.all([
      this.getStatistics(query),
      this.getRecentAppointments(limit),
      this.getRecentReports(limit),
      this.getRecentPrescriptions(limit),
      this.getDoctorCountBySpecialization(),
      this.getAppointmentStatusAnalytics()
    ]);

    return {
      statistics,
      doctorCountBySpecialization,
      appointmentStatusAnalytics,
      recentActivity: {
        appointments: recentAppointments,
        reports: recentReports,
        prescriptions: recentPrescriptions
      }
    };
  }
}

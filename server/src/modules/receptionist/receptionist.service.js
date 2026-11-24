import prisma from '../../database/prisma.js';
import { ROLES } from '../../constants/roles.js';

export class ReceptionistService {
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
   * Helper: Round amount to 2 decimal places
   */
  static round(val) {
    return Math.round((Number(val) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Helper: Standardizes appointment representation
   */
  static formatAppointment(a) {
    if (!a) return null;
    return {
      id: a.id,
      appointmentDate: a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : a.appointmentDate,
      timeSlot: a.timeSlot,
      status: a.status,
      reason: a.reason,
      notes: a.notes,
      doctor: a.doctor
        ? {
            id: a.doctor.id,
            name: a.doctor.user?.name,
            specialization: a.doctor.specialization,
            department: a.doctor.department,
            consultationFee: a.doctor.consultationFee
          }
        : null,
      patient: a.patient
        ? {
            id: a.patient.id,
            name: a.patient.user?.name,
            email: a.patient.user?.email,
            phone: a.patient.user?.phone,
            gender: a.patient.gender,
            bloodGroup: a.patient.bloodGroup,
            emergencyContact: a.patient.emergencyContact
          }
        : null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt
    };
  }

  /**
   * Complete Front-Desk Receptionist Dashboard Overview
   */
  static async getDashboardOverview(query = {}) {
    const { startOfDay, endOfDay, dateString } = this.getDayBounds(query.date);

    // End of next 7 days
    const nextWeekEnd = new Date(endOfDay.getTime() + 7 * 86400000);

    const [
      todayAppointmentsTotal,
      todayAppointmentsPending,
      todayAppointmentsConfirmed,
      todayAppointmentsCompleted,
      todayAppointmentsCancelled,
      totalPatientsCount,
      patientsRegisteredToday,
      pendingBills,
      availableDoctorsCount,
      todayAppointmentsList,
      upcomingAppointmentsList,
      recentPatientsList,
      doctorsList
    ] = await Promise.all([
      // 1-5: Today's Appointments by Status
      prisma.appointment.count({
        where: { appointmentDate: { gte: startOfDay, lte: endOfDay } }
      }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'PENDING' }
      }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'CONFIRMED' }
      }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'COMPLETED' }
      }),
      prisma.appointment.count({
        where: { appointmentDate: { gte: startOfDay, lte: endOfDay }, status: 'CANCELLED' }
      }),

      // 6-7: Patient Metrics
      prisma.patientProfile.count(),
      prisma.patientProfile.count({
        where: { createdAt: { gte: startOfDay, lte: endOfDay } }
      }),

      // 8: Pending Invoices / Outstanding Balances
      prisma.bill.findMany({
        where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      }),

      // 9: Available Doctors
      prisma.doctorProfile.count({
        where: { availabilityStatus: 'AVAILABLE' }
      }),

      // 10: Today's Appointments Full List
      prisma.appointment.findMany({
        where: { appointmentDate: { gte: startOfDay, lte: endOfDay } },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        },
        orderBy: [{ timeSlot: 'asc' }, { createdAt: 'asc' }]
      }),

      // 11: Upcoming Appointments (next 7 days)
      prisma.appointment.findMany({
        where: { appointmentDate: { gt: endOfDay, lte: nextWeekEnd } },
        include: {
          doctor: { include: { user: true } },
          patient: { include: { user: true } }
        },
        orderBy: { appointmentDate: 'asc' },
        take: 10
      }),

      // 12: Recent Patient Registrations
      prisma.patientProfile.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      }),

      // 13: Active Doctors
      prisma.doctorProfile.findMany({
        where: { availabilityStatus: 'AVAILABLE' },
        include: { user: true },
        take: 12
      })
    ]);

    // Aggregate pending bills finances
    const pendingBillsTotalDue = this.round(
      pendingBills.reduce((acc, b) => acc + (b.dueAmount || 0), 0)
    );

    return {
      date: dateString,
      statistics: {
        todayAppointments: {
          total: todayAppointmentsTotal,
          pending: todayAppointmentsPending,
          confirmed: todayAppointmentsConfirmed,
          completed: todayAppointmentsCompleted,
          cancelled: todayAppointmentsCancelled
        },
        patients: {
          total: totalPatientsCount,
          newToday: patientsRegisteredToday
        },
        billing: {
          pendingInvoicesCount: pendingBills.length,
          totalDueAmount: pendingBillsTotalDue
        },
        doctors: {
          availableOnDuty: availableDoctorsCount
        }
      },
      todayAppointments: todayAppointmentsList.map((a) => this.formatAppointment(a)),
      upcomingAppointments: upcomingAppointmentsList.map((a) => this.formatAppointment(a)),
      recentPatients: recentPatientsList.map((p) => ({
        id: p.id,
        userId: p.userId,
        name: p.user?.name,
        email: p.user?.email,
        phone: p.user?.phone,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        emergencyContact: p.emergencyContact,
        address: p.address,
        registeredAt: p.createdAt
      })),
      pendingBills: pendingBills.map((b) => ({
        id: b.id,
        invoiceNumber: b.invoiceNumber,
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount,
        dueAmount: b.dueAmount,
        status: b.status,
        issuedDate: b.issuedDate,
        dueDate: b.dueDate,
        patientName: b.patient?.user?.name || 'Patient',
        patientPhone: b.patient?.user?.phone || 'N/A',
        doctorName: b.doctor?.user?.name ? `Dr. ${b.doctor.user.name}` : 'General'
      })),
      availableDoctors: doctorsList.map((d) => ({
        id: d.id,
        name: d.user?.name,
        specialization: d.specialization,
        department: d.department,
        consultationFee: d.consultationFee,
        availabilityStatus: d.availabilityStatus
      }))
    };
  }

  /**
   * Daily Schedule Timeline View
   */
  static async getDailySchedule(dateInput, doctorId = null) {
    const { startOfDay, endOfDay, dateString } = this.getDayBounds(dateInput);

    const where = {
      appointmentDate: { gte: startOfDay, lte: endOfDay }
    };

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      },
      orderBy: [{ timeSlot: 'asc' }, { createdAt: 'asc' }]
    });

    const formatted = appointments.map((a) => this.formatAppointment(a));

    // Group by time slots
    const scheduleBySlot = {
      MORNING: formatted.filter((a) => a.timeSlot === 'MORNING'),
      AFTERNOON: formatted.filter((a) => a.timeSlot === 'AFTERNOON'),
      EVENING: formatted.filter((a) => a.timeSlot === 'EVENING')
    };

    return {
      date: dateString,
      totalScheduled: formatted.length,
      scheduleBySlot,
      appointments: formatted
    };
  }
}

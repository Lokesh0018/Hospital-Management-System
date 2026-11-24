import prisma from '../../database/prisma.js';
import { REPORT_STATUS } from '../report/report.validation.js';

export class LabService {
  /**
   * Retrieves summary statistics for the Lab Technician Dashboard
   */
  static async getDashboardOverview() {
    const [
      totalReports,
      pendingReports,
      completedReports,
      recentUploads
    ] = await Promise.all([
      prisma.medicalReport.count(),
      prisma.medicalReport.count({
        where: {
          status: {
            in: [REPORT_STATUS.UPLOADED, REPORT_STATUS.UNDER_REVIEW]
          }
        }
      }),
      prisma.medicalReport.count({
        where: {
          status: REPORT_STATUS.REVIEWED
        }
      }),
      prisma.medicalReport.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      })
    ]);

    const formattedRecentUploads = recentUploads.map(r => ({
      id: r.id,
      title: r.title,
      reportType: r.reportType,
      status: r.status,
      reportDate: r.reportDate,
      patientName: r.patient?.user?.name || 'Unknown',
      doctorName: r.doctor?.user?.name || 'Unassigned'
    }));

    return {
      statistics: {
        totalReports,
        pendingReports,
        completedReports
      },
      recentUploads: formattedRecentUploads
    };
  }
}

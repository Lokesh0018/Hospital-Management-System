import { AdminService } from './admin.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class AdminController {
  /**
   * Unified Dashboard Overview (Combines statistics, recent activity, and analytics)
   */
  static async getDashboardOverview(req, res, next) {
    try {
      const data = await AdminService.getDashboardOverview(req.query);
      return ApiResponse.ok(res, data, 'Admin dashboard overview retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Core Dashboard Statistics (KPIs 1 - 10)
   */
  static async getStatistics(req, res, next) {
    try {
      const data = await AdminService.getStatistics(req.query);
      return ApiResponse.ok(res, data, 'Dashboard statistics retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 11. Recent Appointments
   */
  static async getRecentAppointments(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const data = await AdminService.getRecentAppointments(limit);
      return ApiResponse.ok(res, data, 'Recent appointments retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 12. Recent Reports
   */
  static async getRecentReports(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const data = await AdminService.getRecentReports(limit);
      return ApiResponse.ok(res, data, 'Recent medical reports retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 13. Recent Prescriptions
   */
  static async getRecentPrescriptions(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const data = await AdminService.getRecentPrescriptions(limit);
      return ApiResponse.ok(res, data, 'Recent prescriptions retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 14. Doctor Count by Specialization
   */
  static async getDoctorCountBySpecialization(req, res, next) {
    try {
      const data = await AdminService.getDoctorCountBySpecialization();
      return ApiResponse.ok(res, data, 'Doctor count by specialization retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * 15. Appointment Status Analytics
   */
  static async getAppointmentStatusAnalytics(req, res, next) {
    try {
      const data = await AdminService.getAppointmentStatusAnalytics();
      return ApiResponse.ok(res, data, 'Appointment status analytics retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }
}

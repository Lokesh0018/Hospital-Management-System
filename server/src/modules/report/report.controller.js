import { ReportService } from './report.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { REPORT_TYPES, REPORT_STATUS_LIST } from './report.validation.js';

export class ReportController {
  /**
   * Upload / Create a new medical report metadata
   */
  static async createReport(req, res, next) {
    try {
      const report = await ReportService.createReport(req.user, req.body);
      return ApiResponse.created(res, report, 'Medical report metadata uploaded successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all medical reports with filtering and RBAC visibility rules
   */
  static async getAllReports(req, res, next) {
    try {
      const result = await ReportService.getAllReports(req.user, req.query);
      return ApiResponse.ok(res, result, 'Medical reports retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single medical report by ID
   */
  static async getReportById(req, res, next) {
    try {
      const report = await ReportService.getReportById(req.user, req.params.id);
      return ApiResponse.ok(res, report, 'Medical report details retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get medical reports assigned to the logged-in doctor
   */
  static async getAssignedReports(req, res, next) {
    try {
      const result = await ReportService.getAssignedReports(req.user, req.query);
      return ApiResponse.ok(res, result, 'Assigned medical reports retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update medical report metadata
   */
  static async updateReport(req, res, next) {
    try {
      const updated = await ReportService.updateReport(req.user, req.params.id, req.body);
      return ApiResponse.ok(res, updated, 'Medical report updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Doctor reviews report and adds clinical findings/notes
   */
  static async reviewReport(req, res, next) {
    try {
      const reviewed = await ReportService.reviewReport(req.user, req.params.id, req.body);
      return ApiResponse.ok(res, reviewed, 'Medical report reviewed and notes saved successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a medical report
   */
  static async deleteReport(req, res, next) {
    try {
      const result = await ReportService.deleteReport(req.user, req.params.id);
      return ApiResponse.ok(res, result, 'Medical report deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get supported report types and statuses metadata
   */
  static async getMetadata(req, res, next) {
    try {
      return ApiResponse.ok(
        res,
        {
          reportTypes: REPORT_TYPES,
          statuses: REPORT_STATUS_LIST
        },
        'Medical report metadata retrieved.'
      );
    } catch (error) {
      next(error);
    }
  }
}

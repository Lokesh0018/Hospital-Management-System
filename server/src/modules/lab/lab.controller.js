import { LabService } from './lab.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class LabController {
  /**
   * Get dashboard overview for Lab Technician
   */
  static async getDashboardOverview(req, res, next) {
    try {
      const result = await LabService.getDashboardOverview();
      return ApiResponse.ok(res, result, 'Lab dashboard overview retrieved successfully.');
    } catch (error) {
      next(error);
    }
  }
}

import { ReceptionistService } from './receptionist.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class ReceptionistController {
  /**
   * Get complete front-desk dashboard overview
   */
  static async getDashboardOverview(req, res, next) {
    try {
      const data = await ReceptionistService.getDashboardOverview(req.query);
      return ApiResponse.ok(res, data, 'Receptionist dashboard overview retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get daily hospital appointment schedule grouped by slot
   */
  static async getDailySchedule(req, res, next) {
    try {
      const { date, doctorId } = req.query;
      const data = await ReceptionistService.getDailySchedule(date, doctorId);
      return ApiResponse.ok(res, data, 'Daily appointment schedule retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }
}

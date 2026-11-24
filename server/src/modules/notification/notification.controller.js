import { NotificationService } from './notification.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  static async getNotifications(req, res, next) {
    try {
      const result = await NotificationService.getUserNotifications(req.user, req.query);
      return ApiResponse.ok(res, result, 'Notifications retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAsRead(req.user, req.params.id);
      return ApiResponse.ok(res, result, 'Notification marked as read.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.user);
      return ApiResponse.ok(res, result, 'All notifications marked as read.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/notifications
   */
  static async clearNotifications(req, res, next) {
    try {
      const result = await NotificationService.clearNotifications(req.user);
      return ApiResponse.ok(res, result, 'Notifications cleared successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export default NotificationController;

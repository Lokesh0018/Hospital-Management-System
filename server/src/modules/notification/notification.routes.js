import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * Get user's notifications and unread count
 */
router.get('/', NotificationController.getNotifications);

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications for current user as read
 */
router.patch('/read-all', NotificationController.markAllAsRead);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', NotificationController.markAsRead);

/**
 * DELETE /api/v1/notifications
 * Clear notifications
 */
router.delete('/', NotificationController.clearNotifications);

export default router;

import prisma from '../../database/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ROLES } from '../../constants/roles.js';

export class NotificationService {
  /**
   * Build the Prisma where clause for a user based on their ID and Role
   */
  static _buildUserWhere(user) {
    if (user.role === ROLES.ADMIN) {
      // Admin receives their specific notifications, role notifications, or system broadcasts
      return {
        OR: [
          { userId: user.id },
          { role: ROLES.ADMIN },
          { role: null, userId: null }
        ]
      };
    }

    // Role-scoped users receive their personal notifications, their role-scoped notifications, or system broadcasts
    return {
      OR: [
        { userId: user.id },
        { role: user.role, userId: null },
        { role: null, userId: null }
      ]
    };
  }

  /**
   * Get notifications for the authenticated user
   * @param {Object} user Authenticated user
   * @param {Object} query Query parameters (isRead, page, limit)
   */
  static async getUserNotifications(user, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const baseWhere = this._buildUserWhere(user);
    const where = { ...baseWhere };

    if (query.isRead !== undefined) {
      where.isRead = query.isRead === 'true' || query.isRead === true;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...baseWhere,
          isRead: false
        }
      })
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Mark a single notification as read
   * @param {Object} user
   * @param {string} notificationId
   */
  static async markAsRead(user, notificationId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    // Access check: User must be recipient or Admin
    if (
      notification.userId &&
      notification.userId !== user.id &&
      user.role !== ROLES.ADMIN
    ) {
      throw ApiError.forbidden('You do not have permission to modify this notification');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return updated;
  }

  /**
   * Mark all notifications for the current user as read
   * @param {Object} user
   */
  static async markAllAsRead(user) {
    const where = {
      ...this._buildUserWhere(user),
      isRead: false
    };

    const result = await prisma.notification.updateMany({
      where,
      data: { isRead: true }
    });

    return {
      updatedCount: result.count
    };
  }

  /**
   * Delete / clear notifications for the user
   * @param {Object} user
   */
  static async clearNotifications(user) {
    // Only delete notifications assigned specifically to this user (preserve shared broadcast records)
    const result = await prisma.notification.deleteMany({
      where: {
        userId: user.id
      }
    });

    return {
      deletedCount: result.count
    };
  }
}

export default NotificationService;

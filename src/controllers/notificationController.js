/**
 * Notification Controller
 * Handles user notifications
 */

const Notification = require('../models/Notification');

class NotificationController {
  /**
   * Get user notifications with pagination
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get notifications with pagination
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedId', 'name')
        .lean();

      // Get total count for pagination
      const total = await Notification.countDocuments({ userId });

      // Get unread count
      const unreadCount = await Notification.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: {
          notifications,
          pagination: {
            current: page,
            total: Math.ceil(total / limit),
            count: notifications.length,
            totalItems: total
          },
          unreadCount
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      const unreadCount = await Notification.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationIds } = req.body;

      if (!notificationIds || !Array.isArray(notificationIds)) {
        return res.status(400).json({
          success: false,
          error: 'Notification IDs array is required'
        });
      }

      await Notification.markAsRead(userId, notificationIds);

      res.status(200).json({
        success: true,
        message: 'Notifications marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark single notification as read
   */
  async markSingleAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;

      const notification = await Notification.findOne({ 
        _id: notificationId, 
        userId 
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      await notification.markAsRead();

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.userId;
      const { notificationId } = req.params;

      const notification = await Notification.findOneAndDelete({ 
        _id: notificationId, 
        userId 
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all read notifications
   */
  async clearReadNotifications(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await Notification.deleteMany({ 
        userId, 
        isRead: true 
      });

      res.status(200).json({
        success: true,
        message: `Cleared ${result.deletedCount} read notifications`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();

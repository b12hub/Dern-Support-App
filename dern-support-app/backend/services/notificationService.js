const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Create a new notification
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} - Created notification
 */
exports.createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create({
      ...notificationData,
      createdAt: Date.now()
    });
    
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} - Notifications with pagination info
 */
exports.getUserNotifications = async (userId, filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const query = { user: userId };
    
    // Apply read status filter if provided
    if (filters.isRead !== undefined) {
      query.isRead = filters.isRead;
    }
    
    // Apply type filter if provided
    if (filters.type) {
      query.type = filters.type;
    }
    
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error getting user notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Updated notification
 */
exports.markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      throw new Error('Notification not found or does not belong to the user');
    }
    
    return notification;
  } catch (error) {
    logger.error(`Error marking notification as read: ${error.message}`);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result with count of updated notifications
 */
exports.markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    
    return {
      success: true,
      count: result.nModified
    };
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });
    
    if (!notification) {
      throw new Error('Notification not found or does not belong to the user');
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting notification: ${error.message}`);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread notification count
 */
exports.getUnreadNotificationCount = async (userId) => {
  try {
    return await Notification.countDocuments({ user: userId, isRead: false });
  } catch (error) {
    logger.error(`Error getting unread notification count: ${error.message}`);
    throw error;
  }
};

/**
 * Create a system notification for multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data without user field
 * @returns {Promise<Object>} - Result with count of created notifications
 */
exports.createSystemNotification = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      ...notificationData,
      type: 'system',
      createdAt: Date.now()
    }));
    
    const result = await Notification.insertMany(notifications);
    
    return {
      success: true,
      count: result.length
    };
  } catch (error) {
    logger.error(`Error creating system notifications: ${error.message}`);
    throw error;
  }
};

/**
 * Create a notification for all users of a specific type
 * @param {string} userType - User type (e.g., 'admin', 'technician')
 * @param {Object} notificationData - Notification data without user field
 * @returns {Promise<Object>} - Result with count of created notifications
 */
exports.notifyUsersByType = async (userType, notificationData) => {
  try {
    // Find all users of the specified type
    const users = await User.find({ userType }).select('_id');
    const userIds = users.map(user => user._id);
    
    if (userIds.length === 0) {
      return {
        success: true,
        count: 0
      };
    }
    
    return await exports.createSystemNotification(userIds, notificationData);
  } catch (error) {
    logger.error(`Error notifying users by type: ${error.message}`);
    throw error;
  }
};
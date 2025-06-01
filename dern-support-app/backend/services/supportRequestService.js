const SupportRequest = require('../models/SupportRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Create a new support request
 * @param {Object} requestData - Support request data
 * @param {string} userId - User ID creating the request
 * @returns {Promise<Object>} - Created support request
 */
exports.createSupportRequest = async (requestData, userId) => {
  try {
    // Create the support request
    const supportRequest = await SupportRequest.create({
      ...requestData,
      user: userId,
      status: 'open',
      createdAt: Date.now()
    });

    // Create notification for admin
    await Notification.create({
      user: userId,
      title: 'New Support Request',
      message: `A new support request has been created: ${supportRequest.title}`,
      type: 'support_request',
      relatedTo: {
        model: 'SupportRequest',
        id: supportRequest._id
      }
    });

    return supportRequest;
  } catch (error) {
    logger.error(`Error creating support request: ${error.message}`);
    throw error;
  }
};

/**
 * Get all support requests for a user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Array of support requests
 */
exports.getUserSupportRequests = async (userId, filters = {}) => {
  try {
    const query = { user: userId };
    
    // Apply status filter if provided
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Apply type filter if provided
    if (filters.requestType) {
      query.requestType = filters.requestType;
    }
    
    // Apply date range filter if provided
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }
    
    return await SupportRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName email');
  } catch (error) {
    logger.error(`Error getting user support requests: ${error.message}`);
    throw error;
  }
};

/**
 * Get a support request by ID
 * @param {string} requestId - Support request ID
 * @returns {Promise<Object>} - Support request
 */
exports.getSupportRequestById = async (requestId) => {
  try {
    return await SupportRequest.findById(requestId)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
  } catch (error) {
    logger.error(`Error getting support request by ID: ${error.message}`);
    throw error;
  }
};

/**
 * Update a support request
 * @param {string} requestId - Support request ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated support request
 */
exports.updateSupportRequest = async (requestId, updateData) => {
  try {
    const supportRequest = await SupportRequest.findByIdAndUpdate(
      requestId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!supportRequest) {
      throw new Error('Support request not found');
    }
    
    // Create notification for the user
    if (updateData.status) {
      await Notification.create({
        user: supportRequest.user,
        title: 'Support Request Updated',
        message: `Your support request "${supportRequest.title}" has been updated to ${updateData.status}`,
        type: 'support_request',
        relatedTo: {
          model: 'SupportRequest',
          id: supportRequest._id
        }
      });
    }
    
    return supportRequest;
  } catch (error) {
    logger.error(`Error updating support request: ${error.message}`);
    throw error;
  }
};

/**
 * Add a reply to a support request
 * @param {string} requestId - Support request ID
 * @param {Object} replyData - Reply data
 * @returns {Promise<Object>} - Updated support request
 */
exports.addReplyToSupportRequest = async (requestId, replyData) => {
  try {
    const supportRequest = await SupportRequest.findById(requestId);
    
    if (!supportRequest) {
      throw new Error('Support request not found');
    }
    
    supportRequest.conversation.push({
      ...replyData,
      createdAt: Date.now()
    });
    
    supportRequest.updatedAt = Date.now();
    await supportRequest.save();
    
    // Create notification for the recipient
    const recipientId = replyData.user.toString() === supportRequest.user.toString()
      ? supportRequest.assignedTo
      : supportRequest.user;
    
    if (recipientId) {
      await Notification.create({
        user: recipientId,
        title: 'New Reply to Support Request',
        message: `There is a new reply to the support request "${supportRequest.title}"`,
        type: 'support_request',
        relatedTo: {
          model: 'SupportRequest',
          id: supportRequest._id
        }
      });
    }
    
    return supportRequest;
  } catch (error) {
    logger.error(`Error adding reply to support request: ${error.message}`);
    throw error;
  }
};

/**
 * Get all support requests (admin)
 * @param {Object} filters - Optional filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} - Support requests with pagination info
 */
exports.getAllSupportRequests = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const query = {};
    
    // Apply status filter if provided
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Apply type filter if provided
    if (filters.requestType) {
      query.requestType = filters.requestType;
    }
    
    // Apply priority filter if provided
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    // Apply assignee filter if provided
    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo;
    }
    
    // Apply date range filter if provided
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }
    
    // Apply search filter if provided
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const total = await SupportRequest.countDocuments(query);
    const supportRequests = await SupportRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');
    
    return {
      supportRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error getting all support requests: ${error.message}`);
    throw error;
  }
};

/**
 * Assign a support request to a technician
 * @param {string} requestId - Support request ID
 * @param {string} technicianId - Technician user ID
 * @returns {Promise<Object>} - Updated support request
 */
exports.assignSupportRequest = async (requestId, technicianId) => {
  try {
    const supportRequest = await SupportRequest.findByIdAndUpdate(
      requestId,
      { 
        assignedTo: technicianId,
        status: 'assigned',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'firstName lastName email');
    
    if (!supportRequest) {
      throw new Error('Support request not found');
    }
    
    // Create notification for the technician
    await Notification.create({
      user: technicianId,
      title: 'Support Request Assigned',
      message: `You have been assigned to support request "${supportRequest.title}"`,
      type: 'support_request',
      relatedTo: {
        model: 'SupportRequest',
        id: supportRequest._id
      }
    });
    
    // Create notification for the user
    await Notification.create({
      user: supportRequest.user,
      title: 'Support Request Assigned',
      message: `Your support request "${supportRequest.title}" has been assigned to a technician`,
      type: 'support_request',
      relatedTo: {
        model: 'SupportRequest',
        id: supportRequest._id
      }
    });
    
    return supportRequest;
  } catch (error) {
    logger.error(`Error assigning support request: ${error.message}`);
    throw error;
  }
};
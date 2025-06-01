const Schedule = require('../models/Schedule');
const User = require('../models/User');
const SupportRequest = require('../models/SupportRequest');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

/**
 * Create a new schedule entry
 * @param {Object} scheduleData - Schedule data
 * @returns {Promise<Object>} - Created schedule
 */
exports.createSchedule = async (scheduleData) => {
  try {
    // Check for conflicts
    const conflicts = await checkScheduleConflicts(
      scheduleData.technician,
      scheduleData.startTime,
      scheduleData.endTime
    );
    
    if (conflicts.length > 0) {
      throw new Error('Schedule conflicts with existing appointments');
    }
    
    const schedule = await Schedule.create({
      ...scheduleData,
      createdAt: Date.now()
    });
    
    // Notify the technician
    await Notification.create({
      user: scheduleData.technician,
      title: 'New Schedule Assignment',
      message: `You have been scheduled for ${scheduleData.title} on ${new Date(scheduleData.startTime).toLocaleDateString()}`,
      type: 'scheduling',
      relatedTo: {
        model: 'Schedule',
        id: schedule._id
      }
    });
    
    // If this is for a support request, update the request
    if (scheduleData.supportRequest) {
      await SupportRequest.findByIdAndUpdate(
        scheduleData.supportRequest,
        { 
          status: 'scheduled',
          updatedAt: Date.now()
        }
      );
      
      // Notify the customer
      const supportRequest = await SupportRequest.findById(scheduleData.supportRequest);
      if (supportRequest) {
        await Notification.create({
          user: supportRequest.user,
          title: 'Support Request Scheduled',
          message: `Your support request has been scheduled for ${new Date(scheduleData.startTime).toLocaleDateString()}`,
          type: 'support_request',
          relatedTo: {
            model: 'SupportRequest',
            id: supportRequest._id
          }
        });
      }
    }
    
    return schedule;
  } catch (error) {
    logger.error(`Error creating schedule: ${error.message}`);
    throw error;
  }
};

/**
 * Get all schedules
 * @param {Object} filters - Optional filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} - Schedules with pagination info
 */
exports.getAllSchedules = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const query = {};
    
    // Apply technician filter if provided
    if (filters.technician) {
      query.technician = filters.technician;
    }
    
    // Apply support request filter if provided
    if (filters.supportRequest) {
      query.supportRequest = filters.supportRequest;
    }
    
    // Apply date range filter if provided
    if (filters.startDate || filters.endDate) {
      query.$or = [];
      
      if (filters.startDate && filters.endDate) {
        // Find schedules that overlap with the date range
        query.$or.push({
          startTime: { $lte: new Date(filters.endDate) },
          endTime: { $gte: new Date(filters.startDate) }
        });
      } else if (filters.startDate) {
        query.startTime = { $gte: new Date(filters.startDate) };
      } else if (filters.endDate) {
        query.endTime = { $lte: new Date(filters.endDate) };
      }
    }
    
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Schedule.countDocuments(query);
    const schedules = await Schedule.find(query)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('technician', 'firstName lastName email')
      .populate('supportRequest');
    
    return {
      schedules,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error getting schedules: ${error.message}`);
    throw error;
  }
};

/**
 * Get a schedule by ID
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Object>} - Schedule
 */
exports.getScheduleById = async (scheduleId) => {
  try {
    const schedule = await Schedule.findById(scheduleId)
      .populate('technician', 'firstName lastName email')
      .populate('supportRequest');
    
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    
    return schedule;
  } catch (error) {
    logger.error(`Error getting schedule by ID: ${error.message}`);
    throw error;
  }
};

/**
 * Get schedules for a technician
 * @param {string} technicianId - Technician user ID
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - Schedules
 */
exports.getTechnicianSchedules = async (technicianId, filters = {}) => {
  try {
    const query = { technician: technicianId };
    
    // Apply date range filter if provided
    if (filters.startDate || filters.endDate) {
      if (filters.startDate && filters.endDate) {
        // Find schedules that overlap with the date range
        query.startTime = { $lte: new Date(filters.endDate) };
        query.endTime = { $gte: new Date(filters.startDate) };
      } else if (filters.startDate) {
        query.startTime = { $gte: new Date(filters.startDate) };
      } else if (filters.endDate) {
        query.endTime = { $lte: new Date(filters.endDate) };
      }
    }
    
    return await Schedule.find(query)
      .sort({ startTime: 1 })
      .populate('supportRequest');
  } catch (error) {
    logger.error(`Error getting technician schedules: ${error.message}`);
    throw error;
  }
};

/**
 * Update a schedule
 * @param {string} scheduleId - Schedule ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated schedule
 */
exports.updateSchedule = async (scheduleId, updateData) => {
  try {
    const schedule = await Schedule.findById(scheduleId);
    
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    
    // Check for conflicts if time is being updated
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || schedule.startTime;
      const endTime = updateData.endTime || schedule.endTime;
      
      const conflicts = await checkScheduleConflicts(
        updateData.technician || schedule.technician,
        startTime,
        endTime,
        scheduleId
      );
      
      if (conflicts.length > 0) {
        throw new Error('Schedule update conflicts with existing appointments');
      }
    }
    
    const updatedSchedule = await Schedule.findByIdAndUpdate(
      scheduleId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('technician', 'firstName lastName email')
      .populate('supportRequest');
    
    // Notify the technician if the schedule was updated
    await Notification.create({
      user: updatedSchedule.technician,
      title: 'Schedule Updated',
      message: `Your schedule for ${updatedSchedule.title} has been updated`,
      type: 'scheduling',
      relatedTo: {
        model: 'Schedule',
        id: updatedSchedule._id
      }
    });
    
    return updatedSchedule;
  } catch (error) {
    logger.error(`Error updating schedule: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a schedule
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteSchedule = async (scheduleId) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(scheduleId);
    
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    
    // Notify the technician
    await Notification.create({
      user: schedule.technician,
      title: 'Schedule Cancelled',
      message: `Your schedule for ${schedule.title} has been cancelled`,
      type: 'scheduling',
      relatedTo: {
        model: 'Schedule',
        id: schedule._id
      }
    });
    
    // If this was for a support request, update the request
    if (schedule.supportRequest) {
      const supportRequest = await SupportRequest.findById(schedule.supportRequest);
      if (supportRequest) {
        await SupportRequest.findByIdAndUpdate(
          schedule.supportRequest,
          { 
            status: 'open',
            updatedAt: Date.now()
          }
        );
        
        // Notify the customer
        await Notification.create({
          user: supportRequest.user,
          title: 'Schedule Cancelled',
          message: `The scheduled appointment for your support request has been cancelled`,
          type: 'support_request',
          relatedTo: {
            model: 'SupportRequest',
            id: supportRequest._id
          }
        });
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting schedule: ${error.message}`);
    throw error;
  }
};

/**
 * Get available technicians for a time slot
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {Promise<Array>} - Available technicians
 */
exports.getAvailableTechnicians = async (startTime, endTime) => {
  try {
    // Find all technicians
    const technicians = await User.find({ userType: 'technician' })
      .select('_id firstName lastName email');
    
    // Find technicians who have conflicting schedules
    const busyTechnicians = await Schedule.find({
      startTime: { $lt: new Date(endTime) },
      endTime: { $gt: new Date(startTime) }
    }).distinct('technician');
    
    // Filter out busy technicians
    const availableTechnicians = technicians.filter(
      tech => !busyTechnicians.some(id => id.equals(tech._id))
    );
    
    return availableTechnicians;
  } catch (error) {
    logger.error(`Error getting available technicians: ${error.message}`);
    throw error;
  }
};

/**
 * Auto-assign a technician to a support request
 * @param {string} supportRequestId - Support request ID
 * @param {Date} preferredDate - Preferred date for the appointment
 * @param {number} durationHours - Duration in hours
 * @returns {Promise<Object>} - Created schedule
 */
exports.autoAssignTechnician = async (supportRequestId, preferredDate, durationHours = 2) => {
  try {
    const supportRequest = await SupportRequest.findById(supportRequestId);
    
    if (!supportRequest) {
      throw new Error('Support request not found');
    }
    
    // Calculate start and end times
    const startTime = new Date(preferredDate);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + durationHours);
    
    // Get available technicians
    const availableTechnicians = await exports.getAvailableTechnicians(startTime, endTime);
    
    if (availableTechnicians.length === 0) {
      throw new Error('No technicians available for the requested time slot');
    }
    
    // Select the first available technician (in a real system, this would use a more sophisticated algorithm)
    const selectedTechnician = availableTechnicians[0];
    
    // Create the schedule
    const scheduleData = {
      title: `Support for ${supportRequest.title}`,
      description: supportRequest.description,
      technician: selectedTechnician._id,
      supportRequest: supportRequestId,
      startTime,
      endTime,
      location: supportRequest.location || 'To be determined',
      status: 'scheduled'
    };
    
    return await exports.createSchedule(scheduleData);
  } catch (error) {
    logger.error(`Error auto-assigning technician: ${error.message}`);
    throw error;
  }
};

/**
 * Check for schedule conflicts
 * @param {string} technicianId - Technician ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @param {string} excludeScheduleId - Schedule ID to exclude from conflict check
 * @returns {Promise<Array>} - Conflicting schedules
 * @private
 */
const checkScheduleConflicts = async (technicianId, startTime, endTime, excludeScheduleId = null) => {
  const query = {
    technician: technicianId,
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  };
  
  if (excludeScheduleId) {
    query._id = { $ne: excludeScheduleId };
  }
  
  return await Schedule.find(query);
};
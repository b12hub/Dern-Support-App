import {validationResult} from "express-validator";
let Schedule;
Schedule = require('../models/Schedule.js');
let SupportRequest;
SupportRequest = require('../models/SupportRequest.js');
let User;
User = require('../models/User.js');

// Get all technicians
exports.getAllTechnicians = async (req, res, next) => {
    try {
        // Check if user is_admin or technician
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const technicians = await User.find({ userType: 'technician' })
            .select('_id email profile.firstName profile.lastName');

        res.status(200).json({ technicians });
    } catch (error) {
        next(error);
    }
};

// Get schedule
exports.getSchedule = async (req, res, next) => {
    try {
        // Check if user is_admin or technician
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { startDate, endDate, technicianId, status } = req.query;

        // Build query
        const query = {};

        if (startDate && endDate) {
            query.scheduledStart = { $gte: new Date(startDate) };
            query.scheduledEnd = { $lte: new Date(endDate) };
        } else if (startDate) {
            query.scheduledStart = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.scheduledEnd = { $lte: new Date(endDate) };
        }

        if (technicianId) {
            query.technician = technicianId;
        }

        if (status) {
            query.status = status;
        }

        // If user is a technician, only show their own schedule
        if (req.user.userType === 'technician') {
            query.technician = req.user.userId;
        }

        const schedules = await Schedule.find(query)
            .populate('technician', 'profile.firstName profile.lastName')
            .populate('supportRequest', 'title requestType priority')
            .populate('createdBy', 'profile.firstName profile.lastName')
            .sort({ scheduledStart: 1 });

        res.status(200).json({ schedules });
    } catch (error) {
        next(error);
    }
};

// Create a new schedule
exports.createSchedule = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { technicianId, supportRequestId, scheduledStart, scheduledEnd, notes, priority, location } = req.body;

        // Validate technician exists
        const technician = await User.findById(technicianId);
        if (!technician || technician.userType !== 'technician') {
            return res.status(400).json({ message: 'Invalid technician' });
        }

        // Validate support request exists
        const supportRequest = await SupportRequest.findById(supportRequestId);
        if (!supportRequest) {
            return res.status(400).json({ message: 'Invalid support request' });
        }

        // Check for scheduling conflicts
        const conflicts = await Schedule.find({
            technician: technicianId,
            $or: [
                {
                    scheduledStart: { $lt: new Date(scheduledEnd) },
                    scheduledEnd: { $gt: new Date(scheduledStart) }
                }
            ],
            status: { $nin: ['completed', 'cancelled'] }
        });

        if (conflicts.length > 0) {
            return res.status(400).json({
                message: 'Scheduling conflict detected',
                conflicts
            });
        }

        // Create new schedule
        const schedule = new Schedule({
            technician: technicianId,
            supportRequest: supportRequestId,
            scheduledStart: new Date(scheduledStart),
            scheduledEnd: new Date(scheduledEnd),
            status: 'scheduled',
            notes,
            priority: priority || supportRequest.priority,
            location,
            createdBy: req.user.userId
        });

        await schedule.save();

        // Update support request status if it's new
        if (supportRequest.status === 'new') {
            supportRequest.status = 'assigned';
            supportRequest.assignedTo = technicianId;

            // Add to history
            supportRequest.history.push({
                action: 'assigned',
                performedBy: req.user.userId,
                details: { message: 'Request assigned to technician', technicianId }
            });

            await supportRequest.save();
        }

        res.status(201).json({
            message: 'Schedule created successfully',
            scheduleId: schedule._id
        });
    } catch (error) {
        next(error);
    }
};

// Update a schedule
exports.updateSchedule = async (req, res, next) => {
    try {
        // Check if user is admin or the assigned technician
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        const { scheduledStart, scheduledEnd, status, notes } = req.body;

        const schedule = await Schedule.findById(id);

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // If user is technician, they can only update their own schedules
        if (req.user.userType === 'technician' && schedule.technician.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'You can only update your own schedules' });
        }

        // If user is technician, they can only update status and notes
        if (req.user.userType === 'technician') {
            schedule.status = status || schedule.status;
            schedule.notes = notes || schedule.notes;
        } else {
            // Admin can update all fields
            schedule.scheduledStart = scheduledStart ? new Date(scheduledStart) : schedule.scheduledStart;
            schedule.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : schedule.scheduledEnd;
            schedule.status = status || schedule.status;
            schedule.notes = notes || schedule.notes;

            // Check for scheduling conflicts if dates are changed
            if (scheduledStart || scheduledEnd) {
                const newStart = scheduledStart ? new Date(scheduledStart) : schedule.scheduledStart;
                const newEnd = scheduledEnd ? new Date(scheduledEnd) : schedule.scheduledEnd;

                const conflicts = await Schedule.find({
                    _id: { $ne: id },
                    technician: schedule.technician,
                    $or: [
                        {
                            scheduledStart: { $lt: newEnd },
                            scheduledEnd: { $gt: newStart }
                        }
                    ],
                    status: { $nin: ['completed', 'cancelled'] }
                });

                if (conflicts.length > 0) {
                    return res.status(400).json({
                        message: 'Scheduling conflict detected',
                        conflicts
                    });
                }
            }
        }

        await schedule.save();

        // If status is updated to completed, update the support request
        if (status === 'completed' && schedule.status !== 'completed') {
            const supportRequest = await SupportRequest.findById(schedule.supportRequest);

            if (supportRequest && supportRequest.status !== 'resolved') {
                supportRequest.status = 'resolved';

                // Add to history
                supportRequest.history.push({
                    action: 'resolved',
                    performedBy: req.user.userId,
                    details: { message: 'Support request resolved' }
                });

                await supportRequest.save();
            }
        }

        res.status(200).json({
            message: 'Schedule updated successfully',
            schedule
        });
    } catch (error) {
        next(error);
    }
};

// Get technician assignments
exports.getTechnicianAssignments = async (req, res, next) => {
    try {
        // This endpoint is for technicians to view their assignments
        if (req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { status, date } = req.query;

        // Build query
        const query = {
            technician: req.user.userId
        };

        if (status) {
            query.status = status;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.scheduledStart = { $gte: startOfDay, $lte: endOfDay };
        }

        const assignments = await Schedule.find(query)
            .populate({
                path: 'supportRequest',
                select: 'title description requestType priority status user',
                populate: {
                    path: 'user',
                    select: 'profile.firstName profile.lastName profile.company profile.phone'
                }
            })
            .sort({ scheduledStart: 1 });

        res.status(200).json({ assignments });
    } catch (error) {
        next(error);
    }
};

const { validationResult } = require('express-validator');
const SupportRequest = require('../models/SupportRequest');
const User = require('../models/User');
const supportRequestService = require('../services/supportRequestService');

// Get all support requests for a user
exports.getUserRequests = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query
        const query = { user: userId };
        if (status) {
            query.status = status;
        }

        // Pagination options
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
            populate: { path: 'assignedTo', select: 'profile.firstName profile.lastName' }
        };

        // Get paginated results
        const requests = await SupportRequest.find(query)
            .sort(options.sort)
            .populate(options.populate.path, options.populate.select)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        // Get total count
        const total = await SupportRequest.countDocuments(query);

        res.status(200).json({
            requests,
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(total / options.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get a specific support request
exports.getRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userType = req.user.userType;

        const request = await SupportRequest.findById(id)
            .populate('user', 'email profile')
            .populate('assignedTo', 'email profile');

        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        // Check if user has permission to view this request
        if (userType !== 'admin' && userType !== 'technician' && request.user._id.toString() !== userId) {
            return res.status(403).json({ message: 'You do not have permission to view this request' });
        }

        res.status(200).json({ request });
    } catch (error) {
        next(error);
    }
};

// Create a new support request
exports.createRequest = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const userId = req.user.userId;
        const { title, description, requestType, priority, dynamicFields } = req.body;

        // Create new support request
        const supportRequest = new SupportRequest({
            user: userId,
            title,
            description,
            requestType,
            priority: priority || 'medium',
            dynamicFields: dynamicFields || {},
            status: 'new',
            history: [{
                action: 'created',
                performedBy: userId,
                details: { message: 'Support request created' }
            }]
        });

        await supportRequest.save();

        // Process any attachments if they exist
        if (req.files && req.files.length > 0) {
            const attachments = await supportRequestService.processAttachments(req.files);
            supportRequest.attachments = attachments;
            await supportRequest.save();
        }

        res.status(201).json({
            message: 'Support request created successfully',
            requestId: supportRequest._id
        });
    } catch (error) {
        next(error);
    }
};

// Update a support request
exports.updateRequest = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.user.userId;
        const userType = req.user.userType;
        const { title, description, status, priority } = req.body;

        const request = await SupportRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        // Check if user has permission to update this request
        const isOwner = request.user.toString() === userId;
        const isAdminOrTech = userType === 'admin' || userType === 'technician';

        if (!isOwner && !isAdminOrTech) {
            return res.status(403).json({ message: 'You do not have permission to update this request' });
        }

        // Regular users can only update title and description of their own requests
        if (isOwner && !isAdminOrTech) {
            if (request.status !== 'new' && request.status !== 'on_hold') {
                return res.status(400).json({ message: 'Cannot update request that is already being processed' });
            }

            request.title = title || request.title;
            request.description = description || request.description;
        }

        // Admin and technicians can update status and priority
        if (isAdminOrTech) {
            request.title = title || request.title;
            request.description = description || request.description;
            request.status = status || request.status;
            request.priority = priority || request.priority;
        }

        // Add to history
        request.history.push({
            action: 'updated',
            performedBy: userId,
            details: { message: 'Support request updated', updatedFields: req.body }
        });

        await request.save();

        res.status(200).json({
            message: 'Support request updated successfully',
            request
        });
    } catch (error) {
        next(error);
    }
};

// Add attachment to a support request
exports.addAttachment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const request = await SupportRequest.findById(id);

        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        // Check if user has permission
        if (request.user.toString() !== userId && req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'You do not have permission to add attachments to this request' });
        }

        // Process attachments
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const attachments = await supportRequestService.processAttachments(req.files);

        // Add new attachments to the request
        request.attachments = [...request.attachments, ...attachments];

        // Add to history
        request.history.push({
            action: 'attachment_added',
            performedBy: userId,
            details: { message: 'Attachments added', count: attachments.length }
        });

        await request.save();

        res.status(200).json({
            message: 'Attachments added successfully',
            attachments
        });
    } catch (error) {
        next(error);
    }
};

// Get request history
exports.getRequestHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const userType = req.user.userType;

        const request = await SupportRequest.findById(id)
            .populate({
                path: 'history.performedBy',
                select: 'profile.firstName profile.lastName userType'
            });

        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        // Check if user has permission
        if (request.user.toString() !== userId && userType !== 'admin' && userType !== 'technician') {
            return res.status(403).json({ message: 'You do not have permission to view this request history' });
        }

        res.status(200).json({
            history: request.history
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Get all support requests
exports.getAllRequests = async (req, res, next) => {
    try {
        // Check if user is admin or technician
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { status, priority, assignedTo, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;

        // Pagination options
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        };

        // Get paginated results
        const requests = await SupportRequest.find(query)
            .sort(options.sort)
            .populate('user', 'email profile')
            .populate('assignedTo', 'email profile')
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        // Get total count
        const total = await SupportRequest.countDocuments(query);

        res.status(200).json({
            requests,
            pagination: {
                total,
                page: options.page,
                limit: options.limit,
                pages: Math.ceil(total / options.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Assign request to technician
exports.assignRequest = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        const { technicianId } = req.body;

        // Validate technician exists and is a technician
        const technician = await User.findById(technicianId);
        if (!technician || technician.userType !== 'technician') {
            return res.status(400).json({ message: 'Invalid technician' });
        }

        const request = await SupportRequest.findById(id);
        if (!request) {
            return res.status(404).json({ message: 'Support request not found' });
        }

        // Update request
        request.assignedTo = technicianId;
        if (request.status === 'new') {
            request.status = 'assigned';
        }

        // Add to history
        request.history.push({
            action: 'assigned',
            performedBy: req.user.userId,
            details: { message: 'Request assigned to technician', technicianId }
        });

        await request.save();

        res.status(200).json({
            message: 'Request assigned successfully',
            request
        });
    } catch (error) {
        next(error);
    }
};

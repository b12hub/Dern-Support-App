import express from "express";

import {check} from "express-validator";

import supportRequestController from "../controllers/supportRequestController.js";

import authMiddleware from "../middleware/auth.js";

import fileUpload from "../middleware/fileUpload.js";

let router;
router = express.Router();
// Get all support requests for a user (protected route)
router.get('/', authMiddleware, supportRequestController.getUserRequests());

// Get a specific support request (protected route)
router.get('/:id', authMiddleware, supportRequestController.getRequestById());

// Create a new support request (protected route)
router.post(
    '/',
    [
        authMiddleware,
        fileUpload.array('attachments', 5), // Allow up to 5 file attachments
        check('title', 'Title is required').notEmpty(),
        check('description', 'Description is required').notEmpty(),
        check('requestType', 'Request type is required').isIn(['hardware', 'software', 'network', 'account', 'other'])
    ],
    supportRequestController.createRequest()
);

// Update a support request (protected route)
router.put(
    '/:id',
    [
        authMiddleware,
        check('title', 'Title cannot be empty if provided').optional().notEmpty(),
        check('description', 'Description cannot be empty if provided').optional().notEmpty(),
        check('status', 'Status must be valid if provided').optional().isIn(['new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed']),
        check('priority', 'Priority must be valid if provided').optional().isIn(['low', 'medium', 'high', 'critical'])
    ],
    supportRequestController.updateRequest()
);

// Add attachment to a support request (protected route)
router.post(
    '/:id/attachments',
    [
        authMiddleware,
        fileUpload.array('attachments', 5) // Allow up to 5 file attachments
    ],
    supportRequestController.addAttachment
);

// Get request history (protected route)
router.get('/:id/history', authMiddleware, supportRequestController.getRequestHistory);

// Admin: Get all support requests (protected route)
router.get('/admin/all', authMiddleware, supportRequestController.getAllRequests);

// Admin: Assign request to technician (protected route)
router.post(
    '/:id/assign',
    [
        authMiddleware,
        check('technicianId', 'Technician ID is required').notEmpty()
    ],
    supportRequestController.assignRequest()
);

module.exports = router;

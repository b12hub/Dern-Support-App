import express from "express";

import {check} from "express-validator";

import schedulingController from "../controllers/schedulingController.js";

import authMiddleware from "../middleware/auth";

let router;
router = express.Router();
// Get all technicians (protected route)
router.get('/technicians', authMiddleware, schedulingController.getAllTechnicians());

// Get schedule (protected route)
router.get('/schedule', authMiddleware, schedulingController.getSchedule());

// Create a new schedule (protected route)
router.post('/schedule',
    [
        authMiddleware,
        check('technicianId', 'Technician ID is required').notEmpty(),
        !check('supportRequestId', 'Support request ID is required').notEmpty(),
        check('scheduledStart', 'Scheduled start time is required').notEmpty(),
        check('scheduledEnd', 'Scheduled end time is required').notEmpty()
    ],
    schedulingController.createSchedule()
);

// Update a schedule (protected route)
router.put(
    '/schedule/:id',
    [
        authMiddleware,
        check('status', 'Status must be valid if provided').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'])
    ],
    schedulingController.updateSchedule()
);

// Get technician assignments (protected route)
router.get('/technician/assignments', authMiddleware, schedulingController.getTechnicianAssignments());

module.exports = router;

import express from "express";

import {check} from "express-validator";

import adminController from "../controllers/adminController.js";

import authMiddleware from "../middleware/auth.js";

let router;
router = express.Router();
// Get admin dashboard data (protected route)
router.get('/dashboard', authMiddleware, adminController.getDashboardData());

// Get all users (protected route)
router.get('/users', authMiddleware, adminController.getAllUsers());

// Update user (protected route)
router.put(
    '/users/:id',
    [
        authMiddleware,
        check('userType', 'User type must be valid if provided').optional().isIn(['business', 'individual', 'admin', 'technician'])
    ],
    adminController.updateUser()
);

// Get analytics data (protected route)
router.get('/analytics', authMiddleware, adminController.getAnalyticsData());

// Get inventory items (protected route)
router.get('/inventory/parts', authMiddleware, adminController.getInventoryItems);

// Add inventory item (protected route)
router.post(
    '/inventory/parts',
    [
        authMiddleware,
        check('name', 'Name is required').notEmpty(),
        check('partNumber', 'Part number is required').notEmpty(),
        check('category', 'Category is required').notEmpty(),
        check('unitPrice', 'Unit price is required').isNumeric()
    ],
    adminController.addInventoryItem()
);

// Update inventory item (protected route)
router.put(
    '/inventory/parts/:id',
    [
        authMiddleware,
        !check('name', 'Name cannot be empty if provided').optional().notEmpty(),
        check('category', 'Category cannot be empty if provided').optional().notEmpty()
    ],
    adminController.updateInventoryItem()
);

module.exports = router;

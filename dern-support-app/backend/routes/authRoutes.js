import express from "express";

import {check} from "express-validator";

import authController from "../controllers/authController.js";

import authMiddleware from "../middleware/auth.js";

let router;
router = express.Router();
// Register a new business user
router.post(
    '/register/business',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
        check('firstName', 'First name is required').notEmpty(),
        check('lastName', 'Last name is required').notEmpty(),
        check('company', 'Company name is required').notEmpty()
    ],
    authController.registerBusiness()
);

// Register a new individual user
router.post(
    '/register/individual',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
        check('firstName', 'First name is required').notEmpty(),
        check('lastName', 'Last name is required').notEmpty()
    ],
    authController.registerIndividual()
);

// Login user
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    authController.login()
);

// Verify email
router.get('/verify/:token', authController.verifyEmail());

// Request password reset
router.post(
    '/password-reset',
    [
        check('email', 'Please include a valid email').isEmail()
    ],
    authController.requestPasswordReset()
);

// Reset password
router.post(
    '/password-reset/:token',
    [
        check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
    ],
    authController.resetPassword()
);

// Get current user profile (protected route)
router.get('/me', authMiddleware, authController.getCurrentUser());

// Update user profile (protected route)
router.put(
    '/profile',
    authMiddleware,
    [
        check('firstName', 'First name cannot be empty if provided').optional().notEmpty(),
        check('lastName', 'Last name cannot be empty if provided').optional().notEmpty(),
        check('phone', 'Phone cannot be empty if provided').optional().notEmpty()
    ],
    authController.updateProfile()
);

module.exports = router;

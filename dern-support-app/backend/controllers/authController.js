const User = require("../models/User");
const authService = require("../services/authService");
const {validationResult} = require("express-validator");
const jwt = require("jsonwebtoken");

// Register a new business user
exports.registerBusiness = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, company, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            userType: 'business',
            profile: {
                firstName,
                lastName,
                company,
                phone
            },
            isVerified: false,
            verificationToken: authService.generateVerificationToken()
        });

        await user.save();

        // Send verification email (in a real app)
        // await authService.sendVerificationEmail(user.email, user.verificationToken);

        res.status(201).json({
            message: 'Business user registered successfully. Please check your email for verification.',
            userId: user._id
        });
    } catch (error) {
        next(error);
    }
}

// Register a new individual user
exports.registerIndividual = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, phone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            email,
            password,
            userType: 'individual',
            profile: {
                firstName,
                lastName,
                phone
            },
            isVerified: false,
            verificationToken: authService.generateVerificationToken()
        });

        await user.save();

        // Send verification email (in a real app)
        // await authService.sendVerificationEmail(user.email, user.verificationToken);

        res.status(201).json({
            message: 'Individual user registered successfully. Please check your email for verification.',
            userId: user._id
        });
    } catch (error) {
        next(error);
    }
};

// Login user
exports.login = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email before logging in' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, userType: user.userType },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                profile: {
                    firstName: user.profile.firstName,
                    lastName: user.profile.lastName
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// Verify email
exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;

        // Find user by verification token
        const user = await User.findOne({ verificationToken:token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification token' });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        next(error);
    }
};

// Request password reset
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate reset token and expiry
        const resetToken = authService.generateResetToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Send password reset email (in a real app)
        // await authService.sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        // Find user by reset token and check expiry
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Update password and clear reset token
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (error) {
        next(error);
    }
};

// Get current user profile
exports.getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select('-password -verificationToken -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { firstName, lastName, phone, address } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update profile fields
        user.profile.firstName = firstName || user.profile.firstName;
        user.profile.lastName = lastName || user.profile.lastName;
        user.profile.phone = phone || user.profile.phone;

        if (address) {
            user.profile.address = {
                ...user.profile.address,
                ...address
            };
        }

        await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                profile: user.profile
            }
        });
    } catch (error) {
        next(error);
    }
};

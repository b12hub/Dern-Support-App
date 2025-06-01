import { validationResult } from 'express-validator';
import User from '../models/User.js';
import SupportRequest from '../models/SupportRequest.js';
import KnowledgeArticle from '../models/KnowledgeArticle.js';
import Inventory from '../models/Inventory.js';
import Schedule from '../models/Schedule';

// Get admin dashboard data
export const getDashboardData = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get counts for various entities
        const supportRequestCounts = await SupportRequest.agregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const userCounts = await User.aggregate([
            { $group: { _id: '$userType', count: { $sum: 1 } } }
        ]);

        const knowledgeArticleCount = await KnowledgeArticle.countDocuments({ isPublished: true });

        const lowInventoryItems = await Inventory.find({
            quantity: { $lte: '$reorderLevel' }
        }).countDocuments();

        // Format the data for the dashboard
        const requestStatusCounts = {};
        supportRequestCounts.forEach(item => {
            requestStatusCounts[item._id] = item.count;
        });

        const userTypeCounts = {};
        userCounts.forEach(item => {
            userTypeCounts[item._id] = item.count;
        });

        // Get recent support requests
        const recentRequests = await SupportRequest.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'email profile.firstName profile.lastName')
            .select('title status priority createdAt');

        res.status(200).json({
            supportRequests: {
                total: Object.values(requestStatusCounts).reduce((a, b) => a + b, 0),
                byStatus: requestStatusCounts
            },
            users: {
                total: Object.values(userTypeCounts).reduce((a, b) => a + b, 0),
                byType: userTypeCounts
            },
            knowledgeBase: {
                totalArticles: knowledgeArticleCount
            },
            inventory: {
                lowStockItems: lowInventoryItems
            },
            recentRequests
        });
    } catch (error) {
        next(error);
    }
};

// Get all users
export const getAllUsers = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { userType, search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query
        const query = {};
        if (userType) {
            query.userType = userType;
        }

        if (search) {
            query.$or = [
                { 'profile.firstName': { $regex: search, $options: 'i' } },
                { 'profile.lastName': { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination options
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        };

        // Get paginated results
        const users = await User.find(query)
            .sort(options.sort)
            .select('-password -verificationToken -resetPasswordToken -resetPasswordExpires')
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        // Get total count
        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
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

// Update user
export const updateUser = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        const { userType, isVerified, profile } = req.body;

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        if (userType) {
            user.userType = userType;
        }

        if (isVerified !== undefined) {
            user.isVerified = isVerified;
        }

        if (profile) {
            user.profile = {
                ...user.profile,
                ...profile
            };
        }

        await user.save();

        res.status(200).json({
            message: 'User updated successfully',
            user: {
                id: user._id,
                email: user.email,
                userType: user.userType,
                isVerified: user.isVerified,
                profile: user.profile,
                createdAt: user.createAt,
                updatedAt: user.updateAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get analytics data
export const getAnalyticsData = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { timeRange = 'month' } = req.query;

        // Calculate date range
        let startDate;
        const endDate = new Date();

        switch (timeRange) {
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'quarter':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
        }

        // Get support request trends
        const requestTrends = await SupportRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Get request type distribution
        const requestTypeDistribution = await SupportRequest.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$requestType',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get resolution time averages
        const resolutionTimeData = await SupportRequest.aggregate([
            {
                $match: {
                    status: 'resolved',
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $addFields: {
                    resolutionTime: {
                        $subtract: ['$updatedAt', '$createdAt']
                    }
                }
            },
            {
                $group: {
                    _id: '$requestType',
                    averageTime: { $avg: '$resolutionTime' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format resolution time (convert from ms to hours)
        const resolutionTimes = resolutionTimeData.map(item => ({
            requestType: item._id,
            averageTimeHours: Math.round((item.averageTime / (1000 * 60 * 60)) * 10) / 10,
            count: item.count
        }));

        // Get technician performance
        const technicianPerformance = await SupportRequest.aggregate([
            {
                $match: {
                    status: 'resolved',
                    assignedTo: { $exists: true },
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'assignedTo',
                    foreignField: '_id',
                    as: 'technician'
                }
            },
            {
                $unwind: '$technician'
            },
            {
                $addFields: {
                    resolutionTime: {
                        $subtract: ['$updatedAt', '$createdAt']
                    }
                }
            },
            {
                $group: {
                    _id: '$assignedTo',
                    technicianName: { $first: { $concat: ['$technician.profile.firstName', ' ', '$technician.profile.lastName'] } },
                    averageResolutionTime: { $avg: '$resolutionTime' },
                    requestsResolved: { $sum: 1 }
                }
            },
            {
                $sort: { requestsResolved: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Format technician performance data
        const formattedTechnicianPerformance = technicianPerformance.map(item => ({
            technicianId: item._id,
            technicianName: item.technicianName,
            averageResolutionTimeHours: Math.round((item.averageResolutionTime / (1000 * 60 * 60)) * 10) / 10,
            requestsResolved: item.requestsResolved
        }));

        res.status(200).json({
            timeRange,
            requestTrends,
            requestTypeDistribution,
            resolutionTimes,
            technicianPerformance: formattedTechnicianPerformance
        });
    } catch (error) {
        next(error);
    }
};

// Get inventory items
export const getInventoryItems = async (req, res, next) => {
    try {
        // Check if user is admin or technician
        if (req.user.userType !== 'admin' && req.user.userType !== 'technician') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { category, search, lowStock, page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc' } = req.query;

        // Build query
        const query = {};

        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { partNumber: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (lowStock === 'true') {
            query.quantity = { $lte: '$reorderLevel' };
        }

        // Pagination options
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        };

        // Get paginated results
        const items = await Inventory.find(query)
            .sort(options.sort)
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        // Get total count
        const total = await Inventory.countDocuments(query);

        res.status(200).json({
            items,
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

// Add inventory item
export const addInventoryItem = async (req, res, next) => {
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

        const {
            name, partNumber, category, description, compatibleDevices,
            quantity, reorderLevel, unitPrice, supplier, location
        } = req.body;

        // Check if part number already exists
        const existingItem = await Inventory.findOne({ partNumber  });
        if (existingItem) {
            return res.status(400).json({ message: 'Item with this part number already exists' });
        }

        // Create new inventory item
        const item = new Inventory({
            name,
            partNumber,
            category,
            description,
            compatibleDevices: compatibleDevices || [],
            quantity: quantity || 0,
            reorderLevel: reorderLevel || 5,
            unitPrice,
            supplier,
            location,
            lastRestock: {
                date: new Date(),
                quantity,
                performedBy: req.user.userId
            }
        });

        await item.save();

        res.status(201).json({
            message: 'Inventory item added successfully',
            itemId: item._id
        });
    } catch (error) {
        next(error);
    }
};

// Update inventory item
export const updateInventoryItem = async (req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { id } = req.params;
        const {
            name, category, description, compatibleDevices,
            quantity, reorderLevel, unitPrice, supplier, location
        } = req.body;

        const item = await Inventory.findById(id);

        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        // Update item fields
        item.name = name || item.name;
        item.category = category || item.category;
        item.description = description || item.description;
        item.compatibleDevices = compatibleDevices || item.compatibleDevices;
        item.reorderLevel = reorderLevel !== undefined ? reorderLevel : item.reorderLevel;
        item.unitPrice = unitPrice !== undefined ? unitPrice : item.unitPrice;

        if (supplier) {
            item.supplier = {
                ...item.supplier,
                ...supplier
            };
        }

        if (location) {
            item.location = {
                ...item.location,
                ...location
            };
        }

        // Handle quantity updates separately to track restocking
        if (quantity !== undefined && quantity !== item.quantity) {
            const quantityChange = quantity - item.quantity;

            if (quantityChange > 0) {
                // This is a restock
                item.lastRestock = {
                    date: new Date(),
                    quantity: quantityChange,
                    performedBy: req.user.userId
                };
            }

            item.quantity = quantity;
        }

        await item.save();

        res.status(200).json({
            message: 'Inventory item updated successfully',
            item
        });
    } catch (error) {
        next(error);
    }
};

// Export default object for backward compatibility
export default {
    getDashboardData,
    getAllUsers,
    updateUser,
    getAnalyticsData,
    getInventoryItems,
    addInventoryItem,
    updateInventoryItem
};

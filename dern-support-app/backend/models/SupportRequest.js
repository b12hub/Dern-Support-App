const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    requestType: {
        type: String,
        enum: ['hardware', 'software', 'network', 'account', 'other'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['new', 'assigned', 'in_progress', 'on_hold', 'resolved', 'closed'],
        default: 'new'
    },
    // Dynamic fields based on request type
    dynamicFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    // Attachments
    attachments: [{
        filename: String,
        originalname: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Assigned technician
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Request history for tracking changes
    history: [{
        action: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: mongoose.Schema.Types.Mixed
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
supportRequestSchema.index({ user: 1, status: 1 });
supportRequestSchema.index({ assignedTo: 1, status: 1 });

const SupportRequest = mongoose.model('SupportRequest', supportRequestSchema);

module.exports = SupportRequest;

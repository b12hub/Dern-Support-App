import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    supportRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupportRequest',
        required: true
    },
    scheduledStart: {
        type: Date,
        required: true
    },
    scheduledEnd: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    notes: {
        type: String
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    location: {
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

// Indexes for faster queries
scheduleSchema.index({ technician: 1, scheduledStart: 1 });
scheduleSchema.index({ supportRequest: 1 });
scheduleSchema.index({ status: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;

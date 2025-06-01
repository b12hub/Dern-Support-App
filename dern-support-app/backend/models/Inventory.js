import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    partNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    compatibleDevices: [{
        type: String,
        trim: true
    }],
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    reorderLevel: {
        type: Number,
        required: true,
        min: 0,
        default: 5
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    supplier: {
        name: String,
        contactInfo: String,
        website: String
    },
    location: {
        warehouse: String,
        shelf: String,
        bin: String
    },
    lastRestock: {
        date: Date,
        quantity: Number,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
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

// Index for faster queries
inventorySchema.index({ partNumber: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ quantity: 1 });

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;

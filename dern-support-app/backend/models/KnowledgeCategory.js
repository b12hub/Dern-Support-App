const mongoose = require('mongoose');

const knowledgeCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KnowledgeCategory',
        default: null
    },
    order: {
        type: Number,
        default: 0
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
knowledgeCategorySchema.index({ parentCategory: 1 });

const KnowledgeCategory = mongoose.model('KnowledgeCategory', knowledgeCategorySchema);

module.exports = KnowledgeCategory;

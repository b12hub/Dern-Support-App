const mongoose = require('mongoose');

const knowledgeArticleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KnowledgeCategory',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    viewCount: {
        type: Number,
        default: 0
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
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

// Calculate average rating when a new rating is added
knowledgeArticleSchema.pre('save', function(next) {
    if (this.ratings && this.ratings.length > 0) {
        const totalRating = this.ratings.reduce((sum, rating) => sum + rating.score, 0);
        this.averageRating = totalRating / this.ratings.length;
    }
    next();
});

// Index for faster searches
knowledgeArticleSchema.index({ title: 'text', content: 'text', tags: 'text' });
knowledgeArticleSchema.index({ category: 1 });

const KnowledgeArticle = mongoose.model('KnowledgeArticle', knowledgeArticleSchema);

module.exports = KnowledgeArticle;

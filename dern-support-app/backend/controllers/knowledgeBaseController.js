const { validationResult } = require('express-validator');
const KnowledgeArticle = require('../models/KnowledgeArticle');
const KnowledgeCategory = require('../models/KnowledgeCategory');

// Get all knowledge base categories
exports.getAllCategories = async (req, res, next) => {
    try {
        const categories = await KnowledgeCategory.find().sort({ order: 1, name: 1 });

        res.status(200).json({ categories });
    } catch (error) {
        next(error);
    }
};

// Get all knowledge base articles with filtering and search
exports.getAllArticles = async (req, res, next) => {
    try {
        const { category, search, tags, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

        // Build query
        const query = { isPublished: true };

        if (category) {
            query.category = category;
        }

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        if (search) {
            query.$text = { $search: search };
        }

        // Pagination options
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        };

        // Get paginated results
        const articles = await KnowledgeArticle.find(query)
            .sort(options.sort)
            .populate('category', 'name')
            .populate('author', 'profile.firstName profile.lastName')
            .select('-ratings')
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        // Get total count
        const total = await KnowledgeArticle.countDocuments(query);

        res.status(200).json({
            articles,
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

// Get a specific knowledge base article
exports.getArticleById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const article = await KnowledgeArticle.findById(id)
            .populate('category', 'name')
            .populate('author', 'profile.firstName profile.lastName');

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Increment view count
        article.viewCount += 1;
        await article.save();

        res.status(200).json({ article });
    } catch (error) {
        next(error);
    }
};

// Submit feedback for an article
exports.submitArticleFeedback = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const userId = req.user.userId;
        const { score, comment } = req.body;

        const article = await KnowledgeArticle.findById(id);

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // Check if user has already rated this article
        const existingRatingIndex = article.ratings.findIndex(
            rating => rating.user.toString() === userId
        );

        if (existingRatingIndex !== -1) {
            // Update existing rating
            article.ratings[existingRatingIndex].score = score;
            article.ratings[existingRatingIndex].comment = comment;
        } else {
            // Add new rating
            article.ratings.push({
                user: userId,
                score,
                comment
            });
        }

        // Recalculate average rating
        if (article.ratings.length > 0) {
            const totalRating = article.ratings.reduce((sum, rating) => sum + rating.score, 0);
            article.averageRating = totalRating / article.ratings.length;
        }

        await article.save();

        res.status(200).json({
            message: 'Feedback submitted successfully',
            averageRating: article.averageRating
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Create a new knowledge base article
exports.createArticle = async (req, res, next) => {
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

        const { title, content, summary, category, tags, isPublished } = req.body;

        // Validate category exists
        const categoryExists = await KnowledgeCategory.findById(category);
        if (!categoryExists) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Create new article
        const article = new KnowledgeArticle({
            title,
            content,
            summary,
            category,
            tags: tags || [],
            author: req.user.userId,
            isPublished: isPublished !== undefined ? isPublished : false
        });

        await article.save();

        res.status(201).json({
            message: 'Article created successfully',
            articleId: article._id
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Update a knowledge base article
exports.updateArticle = async (req, res, next) => {
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

        const { id } = req.params;
        const { title, content, summary, category, tags, isPublished } = req.body;

        const article = await KnowledgeArticle.findById(id);

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        // If category is being updated, validate it exists
        if (category && category !== article.category.toString()) {
            const categoryExists = await KnowledgeCategory.findById(category);
            if (!categoryExists) {
                return res.status(400).json({ message: 'Invalid category' });
            }
        }

        // Update article fields
        article.title = title || article.title;
        article.content = content || article.content;
        article.summary = summary || article.summary;
        article.category = category || article.category;
        article.tags = tags || article.tags;

        if (isPublished !== undefined) {
            article.isPublished = isPublished;
        }

        await article.save();

        res.status(200).json({
            message: 'Article updated successfully',
            article
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Create a new category
exports.createCategory = async (req, res, next) => {
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

        const { name, description, parentCategory, order } = req.body;

        // Check if category with same name already exists
        const existingCategory = await KnowledgeCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        // If parent category is provided, validate it exists
        if (parentCategory) {
            const parentExists = await KnowledgeCategory.findById(parentCategory);
            if (!parentExists) {
                return res.status(400).json({ message: 'Invalid parent category' });
            }
        }

        // Create new category
        const category = new KnowledgeCategory({
            name,
            description,
            parentCategory: parentCategory || null,
            order: order || 0
        });

        await category.save();

        res.status(201).json({
            message: 'Category created successfully',
            categoryId: category._id
        });
    } catch (error) {
        next(error);
    }
};

// Admin: Update a category
exports.updateCategory = async (req, res, next) => {
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

        const { id } = req.params;
        const { name, description, parentCategory, order } = req.body;

        const category = await KnowledgeCategory.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // If name is being updated, check it doesn't conflict
        if (name && name !== category.name) {
            const existingCategory = await KnowledgeCategory.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
        }

        // If parent category is being updated, validate it exists and isn't self
        if (parentCategory && parentCategory !== category.parentCategory?.toString()) {
            if (parentCategory === id) {
                return res.status(400).json({ message: 'Category cannot be its own parent' });
            }

            const parentExists = await KnowledgeCategory.findById(parentCategory);
            if (!parentExists) {
                return res.status(400).json({ message: 'Invalid parent category' });
            }
        }

        // Update category fields
        category.name = name || category.name;
        category.description = description || category.description;
        category.parentCategory = parentCategory || category.parentCategory;

        if (order !== undefined) {
            category.order = order;
        }

        await category.save();

        res.status(200).json({
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        next(error);
    }
};

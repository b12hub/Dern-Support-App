const KnowledgeArticle = require('../models/KnowledgeArticle');
const KnowledgeCategory = require('../models/KnowledgeCategory');
const logger = require('../utils/logger');

/**
 * Create a new knowledge article
 * @param {Object} articleData - Article data
 * @returns {Promise<Object>} - Created article
 */
exports.createArticle = async (articleData) => {
  try {
    // Generate slug if not provided
    if (!articleData.slug) {
      const slug = articleData.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      
      articleData.slug = slug;
    }
    
    const article = await KnowledgeArticle.create({
      ...articleData,
      createdAt: Date.now()
    });
    
    return article;
  } catch (error) {
    logger.error(`Error creating knowledge article: ${error.message}`);
    throw error;
  }
};

/**
 * Get all knowledge articles
 * @param {Object} filters - Optional filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Object>} - Articles with pagination info
 */
exports.getAllArticles = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const query = {};
    
    // Apply category filter if provided
    if (filters.category) {
      query.category = filters.category;
    }
    
    // Apply tags filter if provided
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    
    // Apply published filter if provided
    if (filters.published !== undefined) {
      query.published = filters.published;
    }
    
    // Apply search filter if provided
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
        { summary: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    const total = await KnowledgeArticle.countDocuments(query);
    const articles = await KnowledgeArticle.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('category', 'name slug')
      .populate('author', 'firstName lastName');
    
    return {
      articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error(`Error getting knowledge articles: ${error.message}`);
    throw error;
  }
};

/**
 * Get a knowledge article by ID or slug
 * @param {string} idOrSlug - Article ID or slug
 * @returns {Promise<Object>} - Article
 */
exports.getArticleByIdOrSlug = async (idOrSlug) => {
  try {
    let article;
    
    // Check if the parameter is a valid MongoDB ID
    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
      article = await KnowledgeArticle.findById(idOrSlug);
    } else {
      article = await KnowledgeArticle.findOne({ slug: idOrSlug });
    }
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    // Increment view count
    article.viewCount += 1;
    await article.save();
    
    return article.populate('category', 'name slug')
      .populate('author', 'firstName lastName');
  } catch (error) {
    logger.error(`Error getting knowledge article: ${error.message}`);
    throw error;
  }
};

/**
 * Update a knowledge article
 * @param {string} articleId - Article ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated article
 */
exports.updateArticle = async (articleId, updateData) => {
  try {
    // Generate slug if title is updated and slug is not provided
    if (updateData.title && !updateData.slug) {
      const slug = updateData.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      
      updateData.slug = slug;
    }
    
    const article = await KnowledgeArticle.findByIdAndUpdate(
      articleId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    return article.populate('category', 'name slug')
      .populate('author', 'firstName lastName');
  } catch (error) {
    logger.error(`Error updating knowledge article: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a knowledge article
 * @param {string} articleId - Article ID
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteArticle = async (articleId) => {
  try {
    const article = await KnowledgeArticle.findByIdAndDelete(articleId);
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting knowledge article: ${error.message}`);
    throw error;
  }
};

/**
 * Get related articles
 * @param {string} articleId - Article ID
 * @param {number} limit - Number of related articles to return
 * @returns {Promise<Array>} - Related articles
 */
exports.getRelatedArticles = async (articleId, limit = 3) => {
  try {
    const article = await KnowledgeArticle.findById(articleId);
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    // Find articles in the same category or with the same tags
    const relatedArticles = await KnowledgeArticle.find({
      _id: { $ne: articleId },
      published: true,
      $or: [
        { category: article.category },
        { tags: { $in: article.tags } }
      ]
    })
      .sort({ viewCount: -1 })
      .limit(limit)
      .populate('category', 'name slug');
    
    return relatedArticles;
  } catch (error) {
    logger.error(`Error getting related articles: ${error.message}`);
    throw error;
  }
};

/**
 * Submit article feedback
 * @param {string} articleId - Article ID
 * @param {Object} feedbackData - Feedback data
 * @returns {Promise<Object>} - Updated article
 */
exports.submitArticleFeedback = async (articleId, feedbackData) => {
  try {
    const article = await KnowledgeArticle.findById(articleId);
    
    if (!article) {
      throw new Error('Article not found');
    }
    
    article.feedback.push({
      ...feedbackData,
      createdAt: Date.now()
    });
    
    await article.save();
    
    return article;
  } catch (error) {
    logger.error(`Error submitting article feedback: ${error.message}`);
    throw error;
  }
};

/**
 * Create a new knowledge category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} - Created category
 */
exports.createCategory = async (categoryData) => {
  try {
    // Generate slug if not provided
    if (!categoryData.slug) {
      const slug = categoryData.name
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      
      categoryData.slug = slug;
    }
    
    const category = await KnowledgeCategory.create({
      ...categoryData,
      createdAt: Date.now()
    });
    
    return category;
  } catch (error) {
    logger.error(`Error creating knowledge category: ${error.message}`);
    throw error;
  }
};

/**
 * Get all knowledge categories
 * @returns {Promise<Array>} - Categories
 */
exports.getAllCategories = async () => {
  try {
    return await KnowledgeCategory.find().sort({ name: 1 });
  } catch (error) {
    logger.error(`Error getting knowledge categories: ${error.message}`);
    throw error;
  }
};

/**
 * Update a knowledge category
 * @param {string} categoryId - Category ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated category
 */
exports.updateCategory = async (categoryId, updateData) => {
  try {
    // Generate slug if name is updated and slug is not provided
    if (updateData.name && !updateData.slug) {
      const slug = updateData.name
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');
      
      updateData.slug = slug;
    }
    
    const category = await KnowledgeCategory.findByIdAndUpdate(
      categoryId,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    return category;
  } catch (error) {
    logger.error(`Error updating knowledge category: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a knowledge category
 * @param {string} categoryId - Category ID
 * @returns {Promise<boolean>} - Success status
 */
exports.deleteCategory = async (categoryId) => {
  try {
    // Check if there are articles using this category
    const articlesCount = await KnowledgeArticle.countDocuments({ category: categoryId });
    
    if (articlesCount > 0) {
      throw new Error('Cannot delete category with associated articles');
    }
    
    const category = await KnowledgeCategory.findByIdAndDelete(categoryId);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting knowledge category: ${error.message}`);
    throw error;
  }
};
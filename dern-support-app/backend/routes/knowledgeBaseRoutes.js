const express = require('express');
const router = express.Router();
const knowledgeBaseController = require('../controllers/knowledgeBaseController');
const auth = require('../middleware/auth');

/**
 * Knowledge Base Routes
 * @module routes/knowledgeBaseRoutes
 */

// Public routes
/**
 * @route GET /api/knowledge-base/categories
 * @description Get all knowledge categories - Public access
 */
router.get('/categories', knowledgeBaseController.getAllCategories);

/**
 * @route GET /api/knowledge-base/articles
 * @description Get all knowledge articles (with optional filters) - Public access
 */
router.get('/articles', knowledgeBaseController.getAllArticles);

/**
 * @route GET /api/knowledge-base/articles/:idOrSlug
 * @description Get a knowledge article by ID or slug - Public access
 */
router.get('/articles/:idOrSlug', knowledgeBaseController.getArticleByIdOrSlug);

/**
 * @route GET /api/knowledge-base/articles/:id/related
 * @description Get related articles - Public access
 */
router.get('/articles/:id/related', knowledgeBaseController.getRelatedArticles);

/**
 * @route POST /api/knowledge-base/articles/:id/feedback
 * @description Submit feedback for an article - Public access
 */
router.post('/articles/:id/feedback', knowledgeBaseController.submitArticleFeedback);

// Admin routes
/**
 * @route POST /api/knowledge-base/categories
 * @description Create a new category - Admin access only
 */
router.post('/categories', auth('admin'), knowledgeBaseController.createCategory);

/**
 * @route PUT /api/knowledge-base/categories/:id
 * @description Update a category - Admin access only
 */
router.put('/categories/:id', auth('admin'), knowledgeBaseController.updateCategory);

/**
 * @route DELETE /api/knowledge-base/categories/:id
 * @description Delete a category - Admin access only
 */
router.delete('/categories/:id', auth('admin'), knowledgeBaseController.deleteCategory);

/**
 * @route POST /api/knowledge-base/articles
 * @description Create a new article - Admin access only
 */
router.post('/articles', auth('admin'), knowledgeBaseController.createArticle);

/**
 * @route PUT /api/knowledge-base/articles/:id
 * @description Update an article - Admin access only
 */
router.put('/articles/:id', auth('admin'), knowledgeBaseController.updateArticle);

/**
 * @route DELETE /api/knowledge-base/articles/:id
 * @description Delete an article - Admin access only
 */
router.delete('/articles/:id', auth('admin'), knowledgeBaseController.deleteArticle);

/**
 * @route GET /api/knowledge-base/stats
 * @description Get knowledge base statistics - Admin access only
 */
router.get('/stats', auth('admin'), knowledgeBaseController.getKnowledgeBaseStats);

/**
 * @route GET /api/knowledge-base/feedback
 * @description Get all article feedback - Admin access only
 */
router.get('/feedback', auth('admin'), knowledgeBaseController.getAllFeedback);

module.exports = router;
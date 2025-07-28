const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createArticle,
  getArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  likeArticle,
  unlikeArticle,
  getArticleLikes
} = require('../controllers/articleController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const createArticleValidation = [
  body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
  body('content').notEmpty().trim(),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('featuredImage').optional().isURL(),
  body('tags').optional().isArray()
];

const updateArticleValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim(),
  body('excerpt').optional().trim().isLength({ max: 500 }),
  body('featuredImage').optional().isURL(),
  body('tags').optional().isArray()
];

const articleIdValidation = [
  param('id').isString().notEmpty()
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['DRAFT', 'SUBMITTED', 'PUBLISHED']),
  query('author').optional().isString(),
  query('search').optional().isString()
];

// Routes
router.post('/', authenticateToken, createArticleValidation, validateRequest, createArticle);
router.get('/', queryValidation, validateRequest, optionalAuth, getArticles);
router.get('/:id', articleIdValidation, validateRequest, optionalAuth, getArticle);
router.put('/:id', authenticateToken, articleIdValidation, updateArticleValidation, validateRequest, updateArticle);
router.delete('/:id', authenticateToken, articleIdValidation, validateRequest, deleteArticle);
router.post('/:id/publish', authenticateToken, requireRole(['ADMIN']), articleIdValidation, validateRequest, publishArticle);
router.post('/:id/like', authenticateToken, articleIdValidation, validateRequest, likeArticle);
router.delete('/:id/like', authenticateToken, articleIdValidation, validateRequest, unlikeArticle);
router.get('/:id/likes', articleIdValidation, validateRequest, getArticleLikes);

module.exports = router;

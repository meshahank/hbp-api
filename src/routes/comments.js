const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createComment,
  getArticleComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const createCommentValidation = [
  body('content').notEmpty().trim().isLength({ min: 1, max: 1000 }),
  body('articleId').isString().notEmpty(),
  body('parentId').optional().isString()
];

const updateCommentValidation = [
  body('content').notEmpty().trim().isLength({ min: 1, max: 1000 })
];

const commentIdValidation = [
  param('id').isString().notEmpty()
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

// Routes
router.post('/', authenticateToken, createCommentValidation, validateRequest, createComment);
router.get('/article/:articleId', queryValidation, validateRequest, getArticleComments);
router.get('/:articleId', queryValidation, validateRequest, getArticleComments); // Alternative route for frontend compatibility
router.put('/:id', authenticateToken, commentIdValidation, updateCommentValidation, validateRequest, updateComment);
router.delete('/:id', authenticateToken, commentIdValidation, validateRequest, deleteComment);

module.exports = router;

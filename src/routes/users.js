const express = require('express');
const { param, query } = require('express-validator');
const {
  getUsers,
  getUser,
  getUserArticles,
  deleteUser
} = require('../controllers/userController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

// Validation rules
const userIdValidation = [
  param('id').isString().notEmpty()
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('role').optional().isIn(['AUTHOR', 'ADMIN']),
  query('search').optional().isString()
];

// Routes
router.get('/', queryValidation, validateRequest, optionalAuth, getUsers);
router.get('/:id', userIdValidation, validateRequest, optionalAuth, getUser);
router.get('/:id/articles', userIdValidation, queryValidation, validateRequest, optionalAuth, getUserArticles);
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), userIdValidation, validateRequest, deleteUser);

module.exports = router;

'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('A valid email address is required.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
      .matches(/\d/)
      .withMessage('Password must contain at least one number.'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required.')
      .isLength({ max: 80 })
      .withMessage('Name cannot exceed 80 characters.'),
  ],
  register
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('A valid email address is required.')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required.'),
  ],
  login
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', auth, getMe);

module.exports = router;

'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  updateSkills,
  addCompletedCourse,
  completeOnboarding,
  deleteAccount,
} = require('../controllers/userController');

const router = Router();

// All user routes require authentication
router.use(auth);

// ── GET /api/users/profile ────────────────────────────────────────────────────
router.get('/profile', getProfile);

// ── PUT /api/users/profile ────────────────────────────────────────────────────
router.put('/profile', updateProfile);

// ── PUT /api/users/skills ─────────────────────────────────────────────────────
router.put('/skills', updateSkills);

// ── POST /api/users/completed-courses ────────────────────────────────────────
router.post('/completed-courses', addCompletedCourse);

// ── POST /api/users/complete-onboarding ──────────────────────────────────────
router.post('/complete-onboarding', completeOnboarding);

// ── DELETE /api/users/account ─────────────────────────────────────────────────
router.delete('/account', deleteAccount);

module.exports = router;

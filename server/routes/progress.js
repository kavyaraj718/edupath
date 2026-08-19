'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  updateProgress,
  getPathProgress,
  getDashboardStats,
  markMilestoneComplete,
} = require('../controllers/progressController');

const router = Router();

// All progress routes require authentication
router.use(auth);

// ── PUT /api/progress/update ──────────────────────────────────────────────────
router.put('/update', updateProgress);

// ── GET /api/progress/dashboard ──────────────────────────────────────────────
router.get('/dashboard', getDashboardStats);

// ── GET /api/progress/path/:pathId ───────────────────────────────────────────
router.get('/path/:pathId', getPathProgress);

// ── POST /api/progress/milestone/:milestoneId/complete ────────────────────────
router.post('/milestone/:milestoneId/complete', markMilestoneComplete);

module.exports = router;

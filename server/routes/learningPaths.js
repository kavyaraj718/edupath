'use strict';

const { Router } = require('express');
const auth = require('../middleware/auth');
const {
  getUserPaths,
  getPath,
  deletePath,
  addFeedback,
} = require('../controllers/learningPathController');

const router = Router();

// All learning path routes require authentication
router.use(auth);

// ── GET /api/paths ────────────────────────────────────────────────────────────
router.get('/', getUserPaths);

// ── GET /api/paths/:id ────────────────────────────────────────────────────────
router.get('/:id', getPath);

// ── DELETE /api/paths/:id ─────────────────────────────────────────────────────
router.delete('/:id', deletePath);

// ── PUT /api/paths/:id/feedback ───────────────────────────────────────────────
router.put('/:id/feedback', addFeedback);

module.exports = router;

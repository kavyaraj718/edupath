'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const {
  generatePath,
  chat,
  explainConcept,
  getSkillGap,
  adaptMilestone,
} = require('../controllers/aiController');

const router = Router();

// Stricter rate limit for AI endpoints (expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI request limit reached. Please try again in an hour.',
  },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  skip: (req) => !req.user, // only rate-limit authenticated users
});

// All AI routes require authentication
router.use(auth);

// ── POST /api/ai/generate-path ────────────────────────────────────────────────
router.post('/generate-path', aiLimiter, generatePath);

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', aiLimiter, chat);

// ── POST /api/ai/explain-concept ──────────────────────────────────────────────
router.post('/explain-concept', explainConcept);

// ── GET /api/ai/skill-gap ─────────────────────────────────────────────────────
router.get('/skill-gap', getSkillGap);

// ── POST /api/ai/adapt-milestone ─────────────────────────────────────────────
router.post('/adapt-milestone', aiLimiter, adaptMilestone);

module.exports = router;

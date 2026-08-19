'use strict';

const { Router } = require('express');
const { getCourses, getCourse, searchCourses } = require('../controllers/courseController');

const router = Router();

// Courses are publicly accessible (no auth required)

// ── GET /api/courses/search ───────────────────────────────────────────────────
// Must be before /:id to avoid 'search' being treated as an ObjectId
router.get('/search', searchCourses);

// ── GET /api/courses ──────────────────────────────────────────────────────────
router.get('/', getCourses);

// ── GET /api/courses/:id ──────────────────────────────────────────────────────
router.get('/:id', getCourse);

module.exports = router;

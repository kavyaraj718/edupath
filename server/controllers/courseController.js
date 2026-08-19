'use strict';

const mongoose = require('mongoose');
const Course = require('../models/Course');

// ─── GET /api/courses ─────────────────────────────────────────────────────────
const getCourses = async (req, res, next) => {
  try {
    const {
      domain,
      difficulty,
      isFree,
      search,
      page = 1,
      limit = 12,
      sortBy = 'rating',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};
    if (domain) filter.domain = { $regex: domain, $options: 'i' };
    if (difficulty && ['beginner', 'intermediate', 'advanced'].includes(difficulty)) {
      filter.difficulty = difficulty;
    }
    if (isFree !== undefined) {
      filter.isFree = isFree === 'true';
    }
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort
    const allowedSortFields = ['rating', 'durationHours', 'enrollmentCount', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'rating';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDir };

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .select('-embedding -__v')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      limit: limitNum,
      courses,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────
const getCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID.' });
    }

    const course = await Course.findById(id).select('-embedding -__v');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    return res.status(200).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/courses/search ──────────────────────────────────────────────────
const searchCourses = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) must be at least 2 characters.',
      });
    }

    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const courses = await Course.find(
      { $text: { $search: q.trim() } },
      { score: { $meta: 'textScore' }, embedding: 0, __v: 0 }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limitNum)
      .lean();

    return res.status(200).json({
      success: true,
      query: q,
      count: courses.length,
      courses,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCourses, getCourse, searchCourses };

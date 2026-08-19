'use strict';

const mongoose = require('mongoose');
const LearningPath = require('../models/LearningPath');
const Progress = require('../models/Progress');

// ─── GET /api/paths ───────────────────────────────────────────────────────────
const getUserPaths = async (req, res, next) => {
  try {
    const paths = await LearningPath.find({ userId: req.user._id })
      .select('-milestones.resources') // lighter payload for list view
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });

    return res.status(200).json({
      success: true,
      count: paths.length,
      paths,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/paths/:id ───────────────────────────────────────────────────────
const getPath = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid path ID.' });
    }

    const path = await LearningPath.findOne({
      _id: id,
      userId: req.user._id,
    }).lean({ virtuals: true });

    if (!path) {
      return res.status(404).json({ success: false, message: 'Learning path not found.' });
    }

    // Populate course details in resources where courseId exists
    const courseIds = [];
    path.milestones.forEach((ms) => {
      ms.resources.forEach((r) => {
        if (r.courseId) courseIds.push(r.courseId);
      });
    });

    const { default: Course } = await Promise.resolve().then(
      () => ({ default: require('../models/Course') })
    );

    const courses = await Course.find({ _id: { $in: courseIds } })
      .select('-embedding -__v')
      .lean();

    const courseMap = {};
    courses.forEach((c) => { courseMap[c._id.toString()] = c; });

    // Attach populated course data
    path.milestones = path.milestones.map((ms) => ({
      ...ms,
      resources: ms.resources.map((r) => ({
        ...r,
        courseDetails: r.courseId ? courseMap[r.courseId.toString()] || null : null,
      })),
    }));

    return res.status(200).json({ success: true, path });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/paths/:id ────────────────────────────────────────────────────
const deletePath = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid path ID.' });
    }

    const path = await LearningPath.findOne({ _id: id, userId: req.user._id });

    if (!path) {
      return res.status(404).json({ success: false, message: 'Learning path not found.' });
    }

    // Delete path and all associated progress
    await Promise.all([
      LearningPath.findByIdAndDelete(id),
      Progress.deleteMany({ pathId: new mongoose.Types.ObjectId(id) }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Learning path and all associated progress deleted.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/paths/:id/feedback ──────────────────────────────────────────────
const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid path ID.' });
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'rating must be a number between 1 and 5.',
      });
    }

    const path = await LearningPath.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        $push: {
          userFeedback: {
            rating,
            comment: comment || '',
            givenAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    if (!path) {
      return res.status(404).json({ success: false, message: 'Learning path not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback submitted. Thank you!',
      feedback: path.userFeedback[path.userFeedback.length - 1],
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserPaths, getPath, deletePath, addFeedback };

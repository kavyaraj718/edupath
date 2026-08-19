'use strict';

const mongoose = require('mongoose');
const Progress = require('../models/Progress');
const LearningPath = require('../models/LearningPath');
const User = require('../models/User');

// ─── PUT /api/progress/update ─────────────────────────────────────────────────
const updateProgress = async (req, res, next) => {
  try {
    const {
      pathId,
      milestoneId,
      courseId,
      status,
      completionPct,
      timeSpentMins,
      difficultyRating,
      engagementScore,
      notes,
    } = req.body;

    if (!pathId || !milestoneId) {
      return res.status(400).json({
        success: false,
        message: 'pathId and milestoneId are required.',
      });
    }

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(pathId) ||
      !mongoose.Types.ObjectId.isValid(milestoneId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pathId or milestoneId.',
      });
    }

    // Build update object
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (completionPct !== undefined) updateData.completionPct = completionPct;
    if (difficultyRating !== undefined) updateData.difficultyRating = difficultyRating;
    if (engagementScore !== undefined) updateData.engagementScore = engagementScore;
    if (notes !== undefined) updateData.notes = notes;

    // Track timing
    if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.completionPct = 100;
    }

    // Increment timeSpentMins using $inc
    const progressDoc = await Progress.findOneAndUpdate(
      {
        userId: req.user._id,
        pathId: new mongoose.Types.ObjectId(pathId),
        milestoneId: new mongoose.Types.ObjectId(milestoneId),
      },
      {
        $set: {
          ...updateData,
          ...(courseId && { courseId }),
        },
        ...(timeSpentMins && { $inc: { timeSpentMins } }),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // Recalculate LearningPath.completionPct
    const stats = await Progress.getPathProgress(req.user._id, pathId);
    await LearningPath.findByIdAndUpdate(pathId, {
      $set: { completionPct: stats.completionPct },
    });

    return res.status(200).json({
      success: true,
      message: 'Progress updated.',
      progress: progressDoc,
      pathCompletionPct: stats.completionPct,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/progress/path/:pathId ──────────────────────────────────────────
const getPathProgress = async (req, res, next) => {
  try {
    const { pathId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ success: false, message: 'Invalid pathId.' });
    }

    const [progressDocs, stats] = await Promise.all([
      Progress.find({
        userId: req.user._id,
        pathId: new mongoose.Types.ObjectId(pathId),
      }).populate('courseId', 'title provider url'),
      Progress.getPathProgress(req.user._id, pathId),
    ]);

    return res.status(200).json({
      success: true,
      pathId,
      stats,
      progress: progressDocs,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/progress/dashboard ─────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Aggregate path-level stats
    const [pathStats, progressStats, user] = await Promise.all([
      LearningPath.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalPaths: { $sum: 1 },
            completedPaths: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            activePaths: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
          },
        },
      ]),
      Progress.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalTimeSpentMins: { $sum: '$timeSpentMins' },
            completedItems: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
      ]),
      User.findById(userId).select('skills completedCourseIds'),
    ]);

    // Weekly activity: last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyRaw = await Progress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          updatedAt: { $gte: sevenDaysAgo },
          timeSpentMins: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
          },
          minutes: { $sum: '$timeSpentMins' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build 7-day array
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMap = {};
    weeklyRaw.forEach((d) => { weeklyMap[d._id] = d.minutes; });

    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      weeklyActivity.push({
        day: days[d.getDay()],
        date: key,
        minutes: weeklyMap[key] || 0,
      });
    }

    // Current streak calculation
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < weeklyActivity.length; i++) {
      const idx = weeklyActivity.length - 1 - i;
      if (weeklyActivity[idx].minutes > 0) {
        currentStreak++;
      } else if (weeklyActivity[idx].date !== today) {
        break;
      }
    }

    const pStats = pathStats[0] || { totalPaths: 0, completedPaths: 0, activePaths: 0 };
    const prStats = progressStats[0] || { totalTimeSpentMins: 0, completedItems: 0 };

    return res.status(200).json({
      success: true,
      stats: {
        totalPaths: pStats.totalPaths,
        completedPaths: pStats.completedPaths,
        activePaths: pStats.activePaths,
        totalHoursSpent: Math.round((prStats.totalTimeSpentMins / 60) * 10) / 10,
        skillsAcquired: user ? user.skills.length : 0,
        completedCourses: user ? user.completedCourseIds.length : 0,
        weeklyActivity,
        currentStreak,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/progress/milestone/:milestoneId/complete ───────────────────────
const markMilestoneComplete = async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const { pathId } = req.body;

    if (!pathId || !mongoose.Types.ObjectId.isValid(pathId)) {
      return res.status(400).json({ success: false, message: 'Valid pathId is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
      return res.status(400).json({ success: false, message: 'Invalid milestoneId.' });
    }

    // Mark all progress docs for this milestone as complete
    await Progress.updateMany(
      {
        userId: req.user._id,
        pathId: new mongoose.Types.ObjectId(pathId),
        milestoneId: new mongoose.Types.ObjectId(milestoneId),
      },
      {
        $set: {
          status: 'completed',
          completionPct: 100,
          completedAt: new Date(),
        },
      },
      { upsert: false }
    );

    // Also mark the milestone's isCompleted flag in the path
    await LearningPath.updateOne(
      {
        _id: new mongoose.Types.ObjectId(pathId),
        userId: req.user._id,
        'milestones._id': new mongoose.Types.ObjectId(milestoneId),
      },
      {
        $set: {
          'milestones.$.isCompleted': true,
          'milestones.$.completedAt': new Date(),
        },
      }
    );

    // Recalculate overall path completion
    const stats = await Progress.getPathProgress(req.user._id, pathId);

    const path = await LearningPath.findById(pathId);
    if (path) {
      path.completionPct = stats.completionPct;
      // Check if all milestones complete
      const allDone = path.milestones.every((m) => m.isCompleted);
      if (allDone) path.status = 'completed';
      await path.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Milestone marked as complete.',
      pathCompletionPct: stats.completionPct,
      pathStatus: path ? path.status : null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  updateProgress,
  getPathProgress,
  getDashboardStats,
  markMilestoneComplete,
};

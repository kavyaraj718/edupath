'use strict';

const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },
    pathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningPath',
      required: [true, 'Path ID is required.'],
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Milestone ID is required.'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'skipped'],
      default: 'not_started',
    },
    completionPct: { type: Number, default: 0, min: 0, max: 100 },
    timeSpentMins: { type: Number, default: 0, min: 0 },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    difficultyRating: { type: Number, min: 1, max: 5, default: null },
    engagementScore: { type: Number, min: 0, max: 100, default: null },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
progressSchema.index({ userId: 1, pathId: 1 });
progressSchema.index({ userId: 1, pathId: 1, milestoneId: 1 }, { unique: true });

// ─── Static Method: getPathProgress ──────────────────────────────────────────
/**
 * Aggregate completion stats for a user's learning path.
 * @param {string|ObjectId} userId
 * @param {string|ObjectId} pathId
 * @returns {Promise<Object>}
 */
progressSchema.statics.getPathProgress = async function (userId, pathId) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const pathObjId = new mongoose.Types.ObjectId(pathId);

  const [result] = await this.aggregate([
    { $match: { userId: userObjId, pathId: pathObjId } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        completedItems: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        skippedItems: {
          $sum: { $cond: [{ $eq: ['$status', 'skipped'] }, 1, 0] },
        },
        inProgressItems: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
        },
        totalTimeSpentMins: { $sum: '$timeSpentMins' },
        avgDifficulty: { $avg: '$difficultyRating' },
        avgEngagement: { $avg: '$engagementScore' },
      },
    },
    {
      $project: {
        _id: 0,
        totalItems: 1,
        completedItems: 1,
        skippedItems: 1,
        inProgressItems: 1,
        totalTimeSpentMins: 1,
        avgDifficulty: { $round: ['$avgDifficulty', 1] },
        avgEngagement: { $round: ['$avgEngagement', 1] },
        completionPct: {
          $cond: [
            { $eq: ['$totalItems', 0] },
            0,
            {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$completedItems', '$totalItems'] },
                    100,
                  ],
                },
                1,
              ],
            },
          ],
        },
      },
    },
  ]);

  return (
    result || {
      totalItems: 0,
      completedItems: 0,
      skippedItems: 0,
      inProgressItems: 0,
      totalTimeSpentMins: 0,
      avgDifficulty: null,
      avgEngagement: null,
      completionPct: 0,
    }
  );
};

module.exports = mongoose.model('Progress', progressSchema);

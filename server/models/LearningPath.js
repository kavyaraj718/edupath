'use strict';

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['course', 'article', 'project', 'quiz', 'video'],
      default: 'course',
    },
    estimatedHours: { type: Number, default: 0, min: 0 },
    whyRecommended: { type: String, default: '' },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    week: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    resources: { type: [resourceSchema], default: [] },
    skills: { type: [String], default: [] },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '' },
    givenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const adaptationSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const learningPathSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required.'],
    },
    title: { type: String, trim: true, default: 'My Learning Path' },
    goal: {
      type: String,
      required: [true, 'A learning goal is required.'],
      trim: true,
    },
    summary: { type: String, default: '' },
    aiExplanation: { type: String, default: '' },
    totalWeeks: { type: Number, default: 4, min: 1 },
    startDate: { type: Date, default: Date.now },
    targetDate: { type: Date, default: null },
    milestones: { type: [milestoneSchema], default: [] },
    prerequisites: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'paused'],
      default: 'active',
    },
    completionPct: { type: Number, default: 0, min: 0, max: 100 },
    userFeedback: { type: [feedbackSchema], default: [] },
    adaptations: { type: [adaptationSchema], default: [] },
    generatedByModel: { type: String, default: 'gpt-4o' },
    promptVersion: { type: String, default: 'v1' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Index ────────────────────────────────────────────────────────────────────
learningPathSchema.index({ userId: 1, createdAt: -1 });

// ─── Virtual: isOverdue ───────────────────────────────────────────────────────
learningPathSchema.virtual('isOverdue').get(function () {
  if (!this.targetDate) return false;
  return this.targetDate < new Date() && this.status !== 'completed';
});

module.exports = mongoose.model('LearningPath', learningPathSchema);

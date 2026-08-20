'use strict';

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required.'],
      trim: true,
    },
    provider: { type: String, trim: true, default: 'Unknown' },
    url: {
      type: String,
      required: [true, 'Course URL is required.'],
      trim: true,
    },
    description: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    topics: { type: [String], default: [] },
    domain: { type: String, trim: true, default: '' },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    prerequisites: { type: [String], default: [] },
    durationHours: { type: Number, default: 0, min: 0 },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0.'],
      max: [5, 'Rating cannot exceed 5.'],
    },
    enrollmentCount: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: false },
    language: { type: String, default: 'English' },
    // Atlas Vector Search field — do NOT create a normal Mongoose index on this
    embedding: { type: [Number], index: false, select: false },
    lastFetched: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// ─── Text Search Index ────────────────────────────────────────────────────────
courseSchema.index({ title: 'text', description: 'text', topics: 'text' });
courseSchema.index({ domain: 1, difficulty: 1, isFree: 1 });

// ─── Static Method: findSimilar (Atlas Vector Search) ────────────────────────
/**
 * Find courses similar to a given embedding using MongoDB Atlas $vectorSearch.
 * @param {number[]} queryEmbedding - Dense float array from Gemini embeddings.
 * @param {number}   limit          - Max number of results to return.
 * @param {string[]} excludeIds     - Array of course IDs (strings) to exclude.
 * @returns {Promise<Course[]>}
 */
courseSchema.statics.findSimilar = async function (queryEmbedding, limit = 12, excludeIds = []) {
  const excludeObjectIds = excludeIds.map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const pipeline = [
    {
      $vectorSearch: {
        index: 'course_vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: 100,
        limit,
        ...(excludeObjectIds.length > 0 && {
          filter: { _id: { $nin: excludeObjectIds } },
        }),
      },
    },
    {
      $addFields: {
        vectorScore: { $meta: 'vectorSearchScore' },
      },
    },
    {
      $project: {
        embedding: 0, // exclude large embedding array from results
        __v: 0,
      },
    },
  ];

  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Course', courseSchema);

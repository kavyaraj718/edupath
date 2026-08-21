'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    verified: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    title: { type: String, default: 'New chat', trim: true, maxlength: 120 },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { _id: false }
);

const learningPreferencesSchema = new mongoose.Schema(
  {
    style: {
      type: String,
      enum: ['visual', 'reading', 'project-based', 'video'],
      default: 'video',
    },
    dailyMinutes: { type: Number, default: 30, min: 5, max: 480 },
    preferredDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: 8,
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters.'],
    },
    avatar: { type: String, default: '' },
    bio: { type: String, maxlength: 500, default: '' },
    currentRole: { type: String, trim: true, default: '' },
    targetRole: { type: String, trim: true, default: '' },
    experience: {
      type: String,
      enum: ['student', 'junior', 'mid', 'senior', 'career-changer'],
      default: 'student',
    },
    skills: { type: [skillSchema], default: [] },
    interests: { type: [String], default: [] },
    completedCourseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    learningPreferences: { type: learningPreferencesSchema, default: () => ({}) },
    timezone: { type: String, default: 'UTC' },
    onboardingComplete: { type: Boolean, default: false },
    chatHistory: { type: [chatMessageSchema], default: [] },
    chatSessions: { type: [chatSessionSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });

// ─── Pre-save: Hash Password ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if passwordHash field is new or modified
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ─── Instance Method: Compare Password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── toJSON Transform: Remove Sensitive Fields ────────────────────────────────
userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);

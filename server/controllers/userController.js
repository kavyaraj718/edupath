'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const LearningPath = require('../models/LearningPath');
const Progress = require('../models/Progress');

// ─── GET /api/users/profile ───────────────────────────────────────────────────
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'completedCourseIds',
      'title provider domain difficulty durationHours url'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/users/profile ───────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name',
      'currentRole',
      'targetRole',
      'experience',
      'bio',
      'timezone',
      'avatar',
      'interests',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Nested learningPreferences
    if (req.body.learningPreferences) {
      const prefs = req.body.learningPreferences;
      const allowedPrefs = ['style', 'dailyMinutes', 'preferredDays'];
      updates.learningPreferences = {};
      allowedPrefs.forEach((key) => {
        if (prefs[key] !== undefined) {
          updates.learningPreferences[key] = prefs[key];
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/users/skills ────────────────────────────────────────────────────
const updateSkills = async (req, res, next) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'skills must be an array.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { skills } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Skills updated successfully.',
      skills: user.skills,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/users/completed-courses ───────────────────────────────────────
const addCompletedCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid courseId is required.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { completedCourseIds: courseId } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Course marked as completed.',
      completedCourseIds: user.completedCourseIds,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/users/complete-onboarding ─────────────────────────────────────
const completeOnboarding = async (req, res, next) => {
  try {
    const {
      currentRole,
      targetRole,
      experience,
      skills,
      interests,
      learningPreferences,
      timezone,
      bio,
    } = req.body;

    const updates = {
      onboardingComplete: true,
    };

    if (currentRole !== undefined) updates.currentRole = currentRole;
    if (targetRole !== undefined) updates.targetRole = targetRole;
    if (experience !== undefined) updates.experience = experience;
    if (skills !== undefined) updates.skills = skills;
    if (interests !== undefined) updates.interests = interests;
    if (timezone !== undefined) updates.timezone = timezone;
    if (bio !== undefined) updates.bio = bio;
    if (learningPreferences !== undefined) updates.learningPreferences = learningPreferences;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully.',
      user,
    });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/users/account ────────────────────────────────────────────────
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete all learning paths and progress first
    const paths = await LearningPath.find({ userId }).select('_id');
    const pathIds = paths.map((p) => p._id);

    await Promise.all([
      LearningPath.deleteMany({ userId }),
      Progress.deleteMany({ userId }),
      Progress.deleteMany({ pathId: { $in: pathIds } }),
      User.findByIdAndDelete(userId),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSkills,
  addCompletedCourse,
  completeOnboarding,
  deleteAccount,
};

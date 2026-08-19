'use strict';

/**
 * Global Express error-handling middleware.
 * Must have exactly 4 parameters: (err, req, res, next).
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isDev = process.env.NODE_ENV === 'development';

  // Log error stack only in development
  if (isDev) {
    console.error('❌ Error:', err.stack || err.message);
  } else {
    console.error(`❌ [${new Date().toISOString()}] ${err.name}: ${err.message}`);
  }

  // ── Mongoose ValidationError ──────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const fieldErrors = Object.keys(err.errors).reduce((acc, field) => {
      acc[field] = err.errors[field].message;
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: fieldErrors,
    });
  }

  // ── Mongoose CastError (invalid ObjectId) ─────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: `Resource not found. Invalid ${err.path}: ${err.value}.`,
    });
  }

  // ── Mongoose Duplicate Key Error (code 11000) ─────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : 'unknown';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field '${field}': '${value}' already exists.`,
      field,
    });
  }

  // ── JWT Errors ────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired. Please log in again.',
    });
  }

  // ── Express-validator errors (passed via next()) ──────────────────────────
  if (err.type === 'validation' && Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: err.errors,
    });
  }

  // ── Generic / Unhandled Error ─────────────────────────────────────────────
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;

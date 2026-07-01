const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      100,             // max 100 requests per window
    message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes',
    },
    standardHeaders: true,
    legacyHeaders:   false,
});

// stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
    max:      10,
    message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
    },
});

module.exports = { limiter, authLimiter };
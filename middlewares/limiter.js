const rateLimit = require('express-rate-limit');

// Create the rate limiter
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per hour
});

module.exports = limiter;

import rateLimit from 'express-rate-limit';

const keyGenerator = (req: any) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

const validationConfig = {
  trustProxy: false,
  xForwardedForHeader: false,
  forwardedHeader: false,
  default: false,
};

// General API rate limiter: 120 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  validate: validationConfig,
  keyGenerator,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.'
  }
});

// Strict limiter for student notifications / requests to prevent spam
export const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: validationConfig,
  keyGenerator,
  message: {
    success: false,
    error: 'You have submitted multiple requests recently. Please wait a few minutes before submitting another.'
  }
});

// View tracking limiter
export const viewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: validationConfig,
  keyGenerator,
  message: {
    success: false,
    error: 'Rate limit exceeded for view tracking.'
  }
});

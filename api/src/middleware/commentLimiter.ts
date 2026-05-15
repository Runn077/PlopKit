import rateLimit from 'express-rate-limit'

export const commentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: { error: 'Too many comments, please slow down.' }
})
import rateLimit from 'express-rate-limit'

export const commentBurstLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 2,
  message: { error: 'Please wait a moment before commenting again.' }
})

export const commentHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'You have commented too many times this hour.' }
})
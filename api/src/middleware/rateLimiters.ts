import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many export requests, please try again later.' },
})

export const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many import attempts, please try again later.' },
})

export const commentBurstLimiter = rateLimit({
  windowMs: 15 * 1000,
  max: 2,
  message: { error: 'Please wait a moment before commenting again.' },
})

export const commentHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'You have commented too many times this hour.' },
})
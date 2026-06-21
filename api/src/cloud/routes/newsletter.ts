import { Router } from 'express'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { validate } from '../../middleware/validate.js'
import resend from '../../lib/resend.js'

const router = Router()

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

router.post('/', newsletterLimiter, validate(subscribeSchema), async (req, res, next) => {
  try {
    const result = await resend.contacts.create({
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      email: req.body.email,
      unsubscribed: false,
    })
    if (result.error) {
      throw new Error(result.error.message)
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
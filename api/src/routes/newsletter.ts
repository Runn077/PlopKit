import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import resend from '../lib/resend.js'

const router = Router()

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

router.post('/', validate(subscribeSchema), async (req, res, next) => {
  try {
    await resend.contacts.create({
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      email: req.body.email,
      unsubscribed: false,
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
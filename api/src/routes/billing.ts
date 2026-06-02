import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import * as billingService from '../services/billing.service.js'
import express from 'express'

const router = Router()

const checkoutSchema = z.object({
  plan: z.enum(['hobby', 'pro']),
})

router.post('/checkout', requireAuth, validate(checkoutSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { plan } = req.body
    const result = await billingService.createCheckoutSession(user.id, plan)
    res.json(result)
  } catch (err) { next(err) }
})

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string
    await billingService.handleWebhook(req.body, signature)
    res.json({ received: true })
  } catch (err) { next(err) }
})

export default router
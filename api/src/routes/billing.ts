import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { z } from 'zod'
import { validate } from '../middleware/validate.js'
import * as billingService from '../services/billing.service.js'

const router = Router()

const checkoutSchema = z.object({
  plan: z.enum(['hobby', 'pro']),
})

const upgradeSchema = z.object({
  plan: z.enum(['pro']),
})

const downgradeSchema = z.object({
  plan: z.enum(['hobby']),
})

router.post('/checkout', requireAuth, validate(checkoutSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { plan } = req.body
    const result = await billingService.createCheckoutSession(user.id, plan)
    res.json(result)
  } catch (err) { next(err) }
})

router.post('/upgrade', requireAuth, validate(upgradeSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { plan } = req.body
    const result = await billingService.upgradeSubscription(user.id, plan)
    res.json(result)
  } catch (err) { next(err) }
})

router.post('/downgrade', requireAuth, validate(downgradeSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { plan } = req.body
    const result = await billingService.downgradeSubscription(user.id, plan)
    res.json(result)
  } catch (err) { next(err) }
})

router.post('/cancel-downgrade', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const result = await billingService.cancelPendingDowngrade(user.id)
    res.json(result)
  } catch (err) { next(err) }
})

router.post('/portal', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const result = await billingService.createPortalSession(user.id)
    res.json(result)
  } catch (err) { next(err) }
})

export default router
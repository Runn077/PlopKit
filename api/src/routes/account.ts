import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import * as accountService from '../services/account.service.js'
import { getWidgetLoadStats } from '../services/widget.service.js'

const router = Router()

const updateNameSchema = z.object({ name: z.string().min(1, 'Name is required') })

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const meta = await accountService.getAccountMeta(user.id)
    res.json(meta)
  } catch (err) { next(err) }
})

router.get('/load-stats', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const stats = await getWidgetLoadStats(user.id)
    res.json(stats)
  } catch (err) { next(err) }
})

router.get('/usage', requireAuth, async (req, res, next) => {
  try {
    if (!process.env.ENABLE_CLOUD) {
      res.status(404).json({ error: 'Usage tracking is not available in self-hosted mode' })
      return
    }
    const { getUsage } = await import('../services/usage.service.js')
    const { user } = res.locals.session
    const usage = await getUsage(user.id, user.plan)
    res.json(usage)
  } catch (err) { next(err) }
})

router.patch('/name', requireAuth, validate(updateNameSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    await accountService.updateName(user.id, req.body.name)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.delete('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    await accountService.deleteAccount(user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
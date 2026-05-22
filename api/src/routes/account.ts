import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { z } from 'zod'
import * as accountService from '../services/account.service.js'

const router = Router()

const updateNameSchema = z.object({ name: z.string().min(1, 'Name is required') })
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const meta = await accountService.getAccountMeta(user.id)
    res.json(meta)
  } catch (err) { next(err) }
})

router.patch('/name', requireAuth, validate(updateNameSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    await accountService.updateName(user.id, req.body.name)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.patch('/password', requireAuth, validate(updatePasswordSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { currentPassword, newPassword } = req.body
    await accountService.updatePassword(user.id, currentPassword, newPassword)
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
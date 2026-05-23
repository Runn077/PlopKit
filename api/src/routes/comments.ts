import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { commentBurstLimiter, commentHourlyLimiter } from '../middleware/commentLimiter.js'
import { getCommentsSchema, getWidgetCommentsSchema, createCommentSchema } from '../validators/comment.validators.js'
import * as commentService from '../services/comment.service.js'

const router = Router()

router.get('/pending', requireAuth, validate(getWidgetCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { widget_key } = req.query as { widget_key: string }
    const data = await commentService.getPendingComments(widget_key, user.id)
    res.json(data)
  } catch (err) { next(err) }
})

router.get('/deleted', requireAuth, validate(getWidgetCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { widget_key } = req.query as { widget_key: string }
    const data = await commentService.getDeletedComments(widget_key, user.id)
    res.json(data)
  } catch (err) { next(err) }
})

router.get('/', validate(getCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { widget_key, page_url, cursor } = req.query as { widget_key: string; page_url?: string; cursor?: string }
    const data = await commentService.getApprovedComments(widget_key, page_url, cursor)
    res.json(data)
  } catch (err) { next(err) }
})

router.post('/', commentBurstLimiter, commentHourlyLimiter, validate(createCommentSchema), async (req, res, next) => {
  try {
    const { widget_key, page_url, body, parent_id, quoted_id } = req.body
    const origin = req.headers.origin ?? req.headers.referer ?? ''
    const comment = await commentService.createComment(widget_key, page_url, body, parent_id, quoted_id, origin)
    res.json(comment)
  } catch (err) { next(err) }
})

router.patch('/:id/approve', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }

    const updated = await commentService.approveComment(id, user.id)
    res.json(updated)
  } catch (err) { next(err) }
})

router.patch('/:id/reject', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await commentService.rejectComment(id, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.patch('/:id/restore', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await commentService.restoreComment(id, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.delete('/deleteAll', requireAuth, validate(getWidgetCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { widget_key } = req.query as { widget_key: string }
    await commentService.permanentDeleteAllDeleted(widget_key, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await commentService.softDeleteComment(id, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.delete('/:id/permanent', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await commentService.permanentDeleteComment(id, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
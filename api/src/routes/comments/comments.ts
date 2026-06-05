import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth.js'
import { validate } from '../../middleware/validate.js'
import { getWidgetCommentsSchema, ownerPostSchema } from '../../validators/comment.validators.js'
import * as commentService from '../../services/comment.service.js'
import { AppError } from '../../errors/appError.js'
import { updateBannedWordsSchema } from '../../validators/comment.validators.js'

const router = Router()

router.get('/approved', requireAuth, validate(getWidgetCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { widget_key, cursor } = req.query as { widget_key: string; cursor?: string }
    const data = await commentService.getApprovedComments(widget_key, cursor, true)
    res.json(data)
  } catch (err) { next(err) }
})

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

router.post('/owner-post', requireAuth, validate(ownerPostSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { widget_key, page_url, body } = req.body
    const comment = await commentService.createOwnerComment(widget_key, page_url, body, user.id)
    res.json(comment)
  } catch (err) { next(err) }
})

router.post('/:id/owner-reply', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    const { body } = req.body
    if (!body) throw new AppError(400, 'Body is required')
    const comment = await commentService.createOwnerReply(id, body, user.id)
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

router.patch('/unpin', requireAuth, validate(getWidgetCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { widget_key } = req.query as { widget_key: string }
    await commentService.unpinComment(widget_key, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

router.patch('/:id/pin', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await commentService.pinComment(id, user.id)
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

router.delete('/:id/permanent', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await commentService.permanentDeleteComment(id, user.id)
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

router.patch('/:id/banned-words', requireAuth, validate(updateBannedWordsSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    const updated = await commentService.updateBannedWords(id, user.id, req.body)
    res.json(updated)
  } catch (err) { next(err) }
})

export default router
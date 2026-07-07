import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { commentBurstLimiter, commentHourlyLimiter } from '../../middleware/rateLimiters.js'
import { getCommentsSchema, createCommentSchema, deleteOwnCommentSchema } from '../../validators/comment.validators.js'
import * as commentService from '../../services/comment.service.js'

const router = Router()

router.get('/', validate(getCommentsSchema, 'query'), async (req, res, next) => {
  try {
    const { widget_key, cursor } = req.query as { widget_key: string; cursor?: string }
    const data = await commentService.getApprovedComments(widget_key, cursor)
    res.json(data)
  } catch (err) { next(err) }
})

router.post('/', commentBurstLimiter, commentHourlyLimiter, validate(createCommentSchema), async (req, res, next) => {
  try {
    const { widget_key, page_url, body, parent_id, quoted_id, author_name, commenter_secret } = req.body
    const origin = req.headers.origin ?? req.headers.referer ?? ''
    const comment = await commentService.createComment(widget_key, page_url, body, parent_id, quoted_id, origin, author_name, commenter_secret)
    res.json(comment)
  } catch (err) { next(err) }
})

router.delete('/', validate(deleteOwnCommentSchema), async (req, res, next) => {
  try {
    const { comment_id, commenter_secret } = req.body
    await commentService.deleteOwnComment(comment_id, commenter_secret)
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
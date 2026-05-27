import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { commentBurstLimiter, commentHourlyLimiter } from '../../middleware/commentLimiter.js'
import { getCommentsSchema, createCommentSchema } from '../../validators/comment.validators.js'
import * as commentService from '../../services/comment.service.js'

const router = Router()

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

export default router
import { Router } from 'express'
import prisma from '../lib/prisma.js'
import sanitizeHtml from 'sanitize-html'
import { requireAuth } from '../middleware/requireAuth.js'
import { commentBurstLimiter, commentHourlyLimiter } from '../middleware/commentLimiter.js'

const router = Router()
const TAKE = 20

router.get('/', async (req, res) => {
  try {
    const { widget_key, page_url, cursor } = req.query as { widget_key: string, page_url?: string, cursor?: string }
    const baseWhere: any = { widgetKey: widget_key, parentId: null }
    if (page_url) baseWhere.pageUrl = page_url
    if (cursor) {
      const cursorComment = await prisma.comment.findUnique({ where: { id: cursor } })
      if (cursorComment) {
        baseWhere.createdAt = { lt: cursorComment.createdAt }
      }
    }
    const countWhere: any = { widgetKey: widget_key, parentId: null }
    if (page_url) countWhere.pageUrl = page_url
    const total = await prisma.comment.count({ where: countWhere })
    const comments = await prisma.comment.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      include: { replies: { orderBy: { createdAt: 'asc' } } }
    })
    const hasMore = comments.length === TAKE
    res.json({ comments, hasMore, total })
  } catch (err) {
    console.error('GET /comments error:', err)
    res.status(500).json({ error: 'Failed to fetch comments' })
  }
})

router.post('/', commentBurstLimiter, commentHourlyLimiter, async (req, res) => {
  try {
    const { widget_key, page_url, body, parent_id } = req.body
    const cleanBody = sanitizeHtml(body, { allowedTags: [], allowedAttributes: {} })
    if (!cleanBody || cleanBody.trim().length === 0) {
      res.status(400).json({ error: 'Comment body is required' })
      return
    }
    if (cleanBody.length > 1000) {
      res.status(400).json({ error: 'Comment must be under 1000 characters' })
      return
    }
    const widget = await prisma.widget.findUnique({
      where: { widgetKey: widget_key },
      include: { site: true }
    })
    if (!widget) {
      res.status(404).json({ error: 'Invalid widget key' })
      return
    }
    if (!widget.site.verified && widget.site.expiresAt && widget.site.expiresAt < new Date()) {
      res.status(403).json({ error: 'Site verification expired. Please re-register your domain.' })
      return
    }
    const origin = req.headers.origin ?? req.headers.referer ?? ''
    const originHostname = new URL(origin).hostname
    const siteHostname = new URL(`https://${widget.site.domain}`).hostname
    if (originHostname !== siteHostname) {
      res.status(403).json({ error: 'Domain not allowed' })
      return
    }
    if (!widget.site.verified) {
      await prisma.site.update({
        where: { id: widget.site.id },
        data: { verified: true, expiresAt: null },
      })
    }
    const comment = await prisma.comment.create({
      data: {
        widgetKey: widget_key,
        pageUrl: page_url,
        body: cleanBody,
        parentId: parent_id ?? null,
      },
    })
    res.json(comment)
  } catch (err) {
    console.error('POST /comments error:', err)
    res.status(500).json({ error: 'Failed to post comment' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string
    const { user } = res.locals.session
    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }
    const widget = await prisma.widget.findUnique({
      where: { widgetKey: comment.widgetKey },
      include: { site: true }
    })
    if (!widget || widget.site.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    await prisma.comment.deleteMany({ where: { parentId: id } })
    await prisma.comment.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /comments error:', err)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

export default router
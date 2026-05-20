import { Router } from 'express'
import prisma from '../lib/prisma.js'
import sanitizeHtml from 'sanitize-html'
import { requireAuth } from '../middleware/requireAuth.js'
import { commentBurstLimiter, commentHourlyLimiter } from '../middleware/commentLimiter.js'
import { CommentStatus } from '../generated/prisma/enums.js'

const router = Router()
const TAKE = 20

async function getWidgetByKey(widgetKey: string) {
  return prisma.widget.findUnique({
    where: { widgetKey },
    include: { site: true, commentWidget: true },
  })
}

router.get('/pending', requireAuth, async (req, res) => {
  try {
    const { widget_key } = req.query as { widget_key: string }
    const { user } = res.locals.session

    const widget = await getWidgetByKey(widget_key)
    if (!widget?.commentWidget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    const commentWidgetId = widget.commentWidget.id

    const comments = await prisma.comment.findMany({
      where: { commentWidgetId, status: CommentStatus.pending, deletedAt: null, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          where: { status: CommentStatus.pending, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const orphanedReplies = await prisma.comment.findMany({
      where: {
        commentWidgetId,
        status: CommentStatus.pending,
        deletedAt: null,
        parentId: { not: null },
        parent: { status: { not: CommentStatus.pending } },
      },
      include: { parent: true },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ comments, orphanedReplies })
  } catch (err) {
    console.error('GET /comments/pending error:', err)
    res.status(500).json({ error: 'Failed to fetch pending comments' })
  }
})

router.get('/deleted', requireAuth, async (req, res) => {
  try {
    const { widget_key } = req.query as { widget_key: string }
    const { user } = res.locals.session

    const widget = await getWidgetByKey(widget_key)
    if (!widget?.commentWidget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    const commentWidgetId = widget.commentWidget.id

    const comments = await prisma.comment.findMany({
      where: { commentWidgetId, deletedAt: { not: null }, parentId: null },
      orderBy: { deletedAt: 'desc' },
      include: {
        replies: {
          where: { deletedAt: { not: null } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    const orphanedReplies = await prisma.comment.findMany({
      where: {
        commentWidgetId,
        deletedAt: { not: null },
        parentId: { not: null },
        parent: { deletedAt: null },
      },
      include: { parent: true },
      orderBy: { deletedAt: 'desc' },
    })

    res.json({ comments, orphanedReplies })
  } catch (err) {
    console.error('GET /comments/deleted error:', err)
    res.status(500).json({ error: 'Failed to fetch deleted comments' })
  }
})

router.get('/', async (req, res) => {
  try {
    const { widget_key, page_url, cursor } = req.query as { widget_key: string, page_url?: string, cursor?: string }

    const widget = await getWidgetByKey(widget_key)
    if (!widget?.commentWidget) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    const commentWidgetId = widget.commentWidget.id

    const baseWhere: any = {
      commentWidgetId,
      status: CommentStatus.approved,
      deletedAt: null,
      parentId: null,
    }
    if (page_url) baseWhere.pageUrl = page_url
    if (cursor) {
      const cursorComment = await prisma.comment.findUnique({ where: { id: cursor } })
      if (cursorComment) {
        baseWhere.createdAt = { lt: cursorComment.createdAt }
      }
    }

    const countWhere: any = {
      commentWidgetId,
      status: CommentStatus.approved,
      deletedAt: null,
      parentId: null,
    }
    if (page_url) countWhere.pageUrl = page_url

    const total = await prisma.comment.count({ where: countWhere })
    const comments = await prisma.comment.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      include: {
        replies: {
          where: { status: CommentStatus.approved, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
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

    const widget = await getWidgetByKey(widget_key)
    if (!widget?.commentWidget) {
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
        commentWidgetId: widget.commentWidget.id,
        widgetKey: widget_key,
        pageUrl: page_url,
        body: cleanBody,
        status: widget.commentWidget.autoApprove ? CommentStatus.approved : CommentStatus.pending,
        parentId: parent_id ?? null,
      },
    })
    res.json(comment)
  } catch (err) {
    console.error('POST /comments error:', err)
    res.status(500).json({ error: 'Failed to post comment' })
  }
})

router.patch('/:id/approve', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string
    const { user } = res.locals.session

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }

    const widget = await getWidgetByKey(comment.widgetKey)
    if (!widget || widget.site.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { status: CommentStatus.approved },
    })
    res.json(updated)
  } catch (err) {
    console.error('PATCH /comments/:id/approve error:', err)
    res.status(500).json({ error: 'Failed to approve comment' })
  }
})

router.patch('/:id/reject', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string
    const { user } = res.locals.session

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }

    const widget = await getWidgetByKey(comment.widgetKey)
    if (!widget || widget.site.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    res.json({ success: true })
  } catch (err) {
    console.error('PATCH /comments/:id/reject error:', err)
    res.status(500).json({ error: 'Failed to reject comment' })
  }
})

router.patch('/:id/restore', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string
    const { user } = res.locals.session

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }

    const widget = await getWidgetByKey(comment.widgetKey)
    if (!widget || widget.site.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { deletedAt: null, status: CommentStatus.approved },
    })
    res.json(updated)
  } catch (err) {
    console.error('PATCH /comments/:id/restore error:', err)
    res.status(500).json({ error: 'Failed to restore comment' })
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

    const widget = await getWidgetByKey(comment.widgetKey)
    if (!widget || widget.site.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    await prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /comments/:id error:', err)
    res.status(500).json({ error: 'Failed to delete comment' })
  }
})

router.delete('/:id/permanent', requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string
    const { user } = res.locals.session

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' })
      return
    }

    const widget = await getWidgetByKey(comment.widgetKey)
    if (!widget || widget.site.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    await prisma.comment.deleteMany({ where: { parentId: id } })
    await prisma.comment.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /comments/:id/permanent error:', err)
    res.status(500).json({ error: 'Failed to permanently delete comment' })
  }
})

export default router
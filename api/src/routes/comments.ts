import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { commentLimiter } from '../middleware/commentLimiter.js'

const router = Router()

const TAKE = 20

router.get('/', async (req, res) => {
  const { site_key, page_url, cursor } = req.query as { site_key: string, page_url?: string, cursor?: string }

  const baseWhere: any = { siteKey: site_key, parentId: null }
  if (page_url) baseWhere.pageUrl = page_url

  if (cursor) {
    const cursorComment = await prisma.comment.findUnique({ where: { id: cursor } })
    if (cursorComment) {
      baseWhere.createdAt = { lt: cursorComment.createdAt }
    }
  }

  const countWhere: any = { siteKey: site_key, parentId: null }
  if (page_url) countWhere.pageUrl = page_url

  const total = await prisma.comment.count({ where: countWhere })
  const comments = await prisma.comment.findMany({
    where: baseWhere,
    orderBy: { createdAt: 'desc' },
    take: TAKE,
    include: {
      replies: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  const hasMore = comments.length === TAKE
  res.json({ comments, hasMore, total })
})

router.post('/', commentLimiter, async (req, res) => {
  const { site_key, page_url, body, parent_id } = req.body

  if (!body || body.trim().length === 0) {
    res.status(400).json({ error: 'Comment body is required' })
    return
  }

  if (body.length > 1000) {
    res.status(400).json({ error: 'Comment must be under 1000 characters' })
    return
  }

  const site = await prisma.site.findUnique({ where: { siteKey: site_key } })
  if (!site) {
    res.status(404).json({ error: 'Invalid site key' })
    return
  }

  // Reject if unverified and expired
  if (!site.verified && site.expiresAt && site.expiresAt < new Date()) {
    res.status(403).json({ error: 'Site verification expired. Please re-register your domain.' })
    return
  }

  // Check origin matches domain
  const origin = req.headers.origin ?? req.headers.referer ?? ''
  const originHostname = new URL(origin).hostname
  const siteHostname = new URL(`https://${site.domain}`).hostname

  if (originHostname !== siteHostname) {
    res.status(403).json({ error: 'Domain not allowed' })
    return
  }

  // Passively verify on first successful request
  if (!site.verified) {
    await prisma.site.update({
      where: { siteKey: site_key },
      data: { verified: true, expiresAt: null },
    })
  }

  const comment = await prisma.comment.create({
    data: {
      siteKey: site_key,
      pageUrl: page_url,
      body,
      parentId: parent_id ?? null,
    },
  })

  res.json(comment)
})

router.delete('/:id', requireAuth, async (req, res) => {
  const id = req.params.id as string
  const { user } = res.locals.session

  // Find the comment
  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) {
    res.status(404).json({ error: 'Comment not found' })
    return
  }

  // Check that the site belongs to the logged in user
  const site = await prisma.site.findUnique({ where: { siteKey: comment.siteKey } })
  if (!site || site.userId !== user.id) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  // Delete replies first, then the comment
  await prisma.comment.deleteMany({ where: { parentId: id } })
  await prisma.comment.delete({ where: { id } })

  res.json({ success: true })
})

export default router
import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

const TAKE = 20

router.get('/', async (req, res) => {
  const { site_key, page_url, cursor } = req.query as { site_key: string, page_url: string, cursor?: string }

  const baseWhere: any = { siteKey: site_key, pageUrl: page_url, parentId: null }

  if (cursor) {
    const cursorComment = await prisma.comment.findUnique({ where: { id: cursor } })
    if (cursorComment) {
      baseWhere.createdAt = { lt: cursorComment.createdAt }
    }
  }

  const total = await prisma.comment.count({ where: { siteKey: site_key, pageUrl: page_url, parentId: null } })

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

router.post('/', async (req, res) => {
  const { site_key, page_url, body, parent_id } = req.body

  const site = await prisma.site.findUnique({ where: { siteKey: site_key } })
  if (!site) {
    res.status(404).json({ error: 'Invalid site key' })
    return
  }

  const comment = await prisma.comment.create({
    data: {
      siteKey: site_key,
      pageUrl: page_url,
      body,
      parentId: parent_id ?? null
    }
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
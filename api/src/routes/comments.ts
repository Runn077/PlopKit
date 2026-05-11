import { Router } from 'express'
import prisma from '../lib/prisma.js'

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

export default router
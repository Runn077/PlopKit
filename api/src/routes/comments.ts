import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

router.get('/', async (req, res) => {
  const { site_key, page_url } = req.query as { site_key: string, page_url: string }

  const comments = await prisma.comment.findMany({
    where: { siteKey: site_key, pageUrl: page_url },
    orderBy: { createdAt: 'desc' }
  })

  res.json(comments)
})

router.post('/', async (req, res) => {
  const { site_key, page_url, body } = req.body

  const comment = await prisma.comment.create({
    data: { siteKey: site_key, pageUrl: page_url, body }
  })

  res.json(comment)
})

export default router
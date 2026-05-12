import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import prisma from '../lib/prisma.js'
import { randomBytes } from 'crypto'

const router = Router()

// Create a site
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body
  const { user } = res.locals.session

  if (!name) {
    res.status(400).json({ error: 'Name is required' })
    return
  }

  const site = await prisma.site.create({
    data: {
      name,
      siteKey: randomBytes(16).toString('hex'),
      userId: user.id,
    },
  })

  res.status(201).json(site)
})

// Get all sites for the logged in user
router.get('/', requireAuth, async (req, res) => {
  const { user } = res.locals.session

  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  res.json(sites)
})

export default router
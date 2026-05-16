import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import prisma from '../lib/prisma.js'
import { randomBytes } from 'crypto'

const router = Router()

router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, domain } = req.body
    const { user } = res.locals.session
    if (!name) {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    if (!domain) {
      res.status(400).json({ error: 'Domain is required' })
      return
    }
    const existing = await prisma.site.findUnique({ where: { domain } })
    if (existing) {
      res.status(409).json({ error: 'This domain is already registered' })
      return
    }
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    const site = await prisma.site.create({
      data: {
        name,
        domain,
        siteKey: randomBytes(16).toString('hex'),
        userId: user.id,
        verified: false,
        expiresAt,
      },
    })
    res.status(201).json(site)
  } catch (err) {
    console.error('POST /sites error:', err)
    res.status(500).json({ error: 'Failed to create site' })
  }
})

router.get('/', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const sites = await prisma.site.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })
    res.json(sites)
  } catch (err) {
    console.error('GET /sites error:', err)
    res.status(500).json({ error: 'Failed to fetch sites' })
  }
})

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const site = await prisma.site.findUnique({
      where: { id: req.params.id as string },
    })
    if (!site || site.userId !== user.id) {
      res.status(404).json({ error: 'Site not found' })
      return
    }
    res.json(site)
  } catch (err) {
    console.error('GET /sites/:id error:', err)
    res.status(500).json({ error: 'Failed to fetch site' })
  }
})

export default router
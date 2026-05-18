import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { randomBytes } from 'crypto'

const router = Router()

router.get('/:siteId', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const siteId = req.params.siteId as string
    const site = await prisma.site.findUnique({ where: { id: siteId } })
    if (!site || site.userId !== user.id) {
      res.status(404).json({ error: 'Site not found' })
      return
    }
    const widgets = await prisma.widget.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
    })
    res.json(widgets)
  } catch (err) {
    console.error('GET /widgets/:siteId error:', err)
    res.status(500).json({ error: 'Failed to fetch widgets' })
  }
})


router.post('/', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const { siteId, type, name } = req.body
    const site = await prisma.site.findUnique({ where: { id: siteId as string } })
    if (!site || site.userId !== user.id) {
      res.status(404).json({ error: 'Site not found' })
      return
    }
    const widget = await prisma.widget.create({
      data: {
        siteId,
        type,
        name,
        widgetKey: randomBytes(16).toString('hex'),
      },
    })
    res.status(201).json(widget)
  } catch (err) {
    console.error('POST /widgets error:', err)
    res.status(500).json({ error: 'Failed to create widget' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const id = req.params.id as string
    const widget = await prisma.widget.findUnique({
      where: { id },
      include: { site: true },
    })
    if (!widget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }
    await prisma.widget.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /widgets/:id error:', err)
    res.status(500).json({ error: 'Failed to delete widget' })
  }
})

router.get('/single/:widgetId', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const widgetId = req.params.widgetId as string
    const widget = await prisma.widget.findUnique({
      where: { id: widgetId },
      include: { site: true },
    })
    if (!widget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }
    res.json(widget)
  } catch (err) {
    console.error('GET /widgets/single/:widgetId error:', err)
    res.status(500).json({ error: 'Failed to fetch widget' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const id = req.params.id as string
    const { name } = req.body

    const widget = await prisma.widget.findUnique({
      where: { id },
      include: { site: true },
    })
    if (!widget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    const updated = await prisma.widget.update({
      where: { id },
      data: { ...(name && { name }) },
    })

    res.json(updated)
  } catch (err) {
    console.error('PATCH /widgets/:id error:', err)
    res.status(500).json({ error: 'Failed to update widget' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const id = req.params.id as string

    const widget = await prisma.widget.findUnique({
      where: { id },
      include: { site: true },
    })
    if (!widget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    await prisma.widget.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    console.error('DELETE /widgets/:id error:', err)
    res.status(500).json({ error: 'Failed to delete widget' })
  }
})

export default router
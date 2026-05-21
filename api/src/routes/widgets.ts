import { Router } from 'express'
import prisma from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { randomBytes } from 'crypto'
import { WidgetType } from '../generated/prisma/enums.js'

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
      include: { commentWidget: true },
    })
    res.json(widgets)
  } catch (err) {
    console.error('GET /widgets/:siteId error:', err)
    res.status(500).json({ error: 'Failed to fetch widgets' })
  }
})

router.get('/single/:widgetId', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const widgetId = req.params.widgetId as string

    const widget = await prisma.widget.findUnique({
      where: { id: widgetId },
      include: { site: true, commentWidget: true },
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
        ...(type === WidgetType.comments && {
          commentWidget: {
            create: { autoApprove: false },
          },
        }),
      },
      include: { commentWidget: true },
    })
    res.status(201).json(widget)
  } catch (err) {
    console.error('POST /widgets error:', err)
    res.status(500).json({ error: 'Failed to create widget' })
  }
})

router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const id = req.params.id as string
    const { name, autoApprove } = req.body

    const widget = await prisma.widget.findUnique({
      where: { id },
      include: { site: true, commentWidget: true },
    })
    if (!widget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    const updated = await prisma.widget.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(autoApprove !== undefined && widget.commentWidget && {
          commentWidget: {
            update: { autoApprove },
          },
        }),
      },
      include: { commentWidget: true },
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

router.patch('/:id/banned-words', requireAuth, async (req, res) => {
  try {
    const { user } = res.locals.session
    const id = req.params.id as string
    const { bannedWords, autoDeleteBannedWords } = req.body

    const widget = await prisma.widget.findUnique({
      where: { id },
      include: { site: true, commentWidget: true },
    })
    if (!widget?.commentWidget || widget.site.userId !== user.id) {
      res.status(404).json({ error: 'Widget not found' })
      return
    }

    const updated = await prisma.commentWidget.update({
      where: { id: widget.commentWidget.id },
      data: {
        ...(bannedWords !== undefined && { bannedWords }),
        ...(autoDeleteBannedWords !== undefined && { autoDeleteBannedWords }),
      },
    })
    res.json(updated)
  } catch (err) {
    console.error('PATCH /widgets/:id/banned-words error:', err)
    res.status(500).json({ error: 'Failed to update banned words' })
  }
})

export default router
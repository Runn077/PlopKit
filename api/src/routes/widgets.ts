import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { createWidgetSchema, updateWidgetSchema } from '../validators/widget.validators.js'
import * as widgetService from '../services/widget.service.js'

const router = Router()

router.get('/:siteId', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { siteId } = req.params as { siteId: string }
    const widgets = await widgetService.getWidgetsBySite(siteId, user.id)
    res.json(widgets)
  } catch (err) { next(err) }
})

router.get('/single/:widgetId', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { widgetId } = req.params as { widgetId: string }
    const widget = await widgetService.getWidgetById(widgetId, user.id)
    res.json(widget)
  } catch (err) { next(err) }
})

router.post('/', requireAuth, validate(createWidgetSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { siteId, type, name } = req.body
    const widget = await widgetService.createWidget(siteId, user.id, type, name)
    res.status(201).json(widget)
  } catch (err) { next(err) }
})

router.patch('/:id', requireAuth, validate(updateWidgetSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    const widget = await widgetService.updateWidget(id, user.id, req.body)
    res.json(widget)
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await widgetService.deleteWidget(id, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

export default router
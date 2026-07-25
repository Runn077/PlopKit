import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { getWidgetConfigSchema } from '../../validators/widget.validators.js'
import { getPublicWidgetConfig } from '../../services/widget.service.js'

const router = Router()

router.get('/', validate(getWidgetConfigSchema, 'query'), async (req, res, next) => {
  try {
    const { widget_key } = req.query as { widget_key: string }
    const config = await getPublicWidgetConfig(widget_key)
    res.set('Cache-Control', 'public, max-age=300')
    res.json(config)
  } catch (err) { next(err) }
})

export default router
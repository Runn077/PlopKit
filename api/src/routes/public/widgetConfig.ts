import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { getWidgetConfigSchema } from '../../validators/widget.validators.js'
import { getPublicWidgetConfig } from '../../services/widget.service.js'

const router = Router()

router.get('/', validate(getWidgetConfigSchema, 'query'), async (req, res, next) => {
  try {
    const { widget_key } = req.query as { widget_key: string }
    const config = await getPublicWidgetConfig(widget_key)

    const lastModified = new Date(config.updatedAt).toUTCString()
    res.set('Last-Modified', lastModified)
    res.set('Cache-Control', 'no-cache')

    if (req.headers['if-modified-since'] === lastModified) {
      return res.status(304).end()
    }

    res.json({ theme: config.theme })
  } catch (err) { next(err) }
})
export default router
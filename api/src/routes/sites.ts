import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { validate } from '../middleware/validate.js'
import { createSiteSchema, updateSiteSchema } from '../validators/site.validators.js'
import { importSiteSchema } from '../validators/import.validators.js'
import { importSite } from '../services/import.service.js'
import * as siteService from '../services/site.service.js'
import rateLimit from 'express-rate-limit'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const sites = await siteService.getSitesByUser(user.id)
    res.json(sites)
  } catch (err) { next(err) }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    const site = await siteService.getSiteById(id, user.id)
    res.json(site)
  } catch (err) { next(err) }
})

router.post('/', requireAuth, validate(createSiteSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { name, domain } = req.body
    const site = await siteService.createSite(user.id, name, domain)
    res.status(201).json(site)
  } catch (err) { next(err) }
})

router.patch('/:id', requireAuth, validate(updateSiteSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    const site = await siteService.updateSite(id, user.id, req.body)
    res.json(site)
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    await siteService.deleteSite(id, user.id)
    res.json({ success: true })
  } catch (err) { next(err) }
})

const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many export requests, please try again later.' },
})

router.get('/:id/export', requireAuth, exportLimiter, async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { id } = req.params as { id: string }
    const data = await siteService.exportSite(id, user.id)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="plopkit-export-${data.site.domain}.json"`)
    res.send(JSON.stringify(data, null, 2))
  } catch (err) { next(err) }
})

const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many import attempts, please try again later.' },
})

router.post('/import', requireAuth, importLimiter, validate(importSiteSchema), async (req, res, next) => {
  try {
    const { user } = res.locals.session
    const { name, domain, data } = req.body
    const site = await importSite(user.id, name, domain, data)
    res.status(201).json(site)
  } catch (err) { next(err) }
})

export default router
import { z } from 'zod'

const domainRegex = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/

const domainSchema = z.string()
  .min(1, 'Domain is required')
  .regex(domainRegex, 'Must be a valid domain (e.g. example.com)')

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: domainSchema,
})

export const updateSiteSchema = z.object({
  name: z.string().min(1).optional(),
  domain: domainSchema.optional(),
})
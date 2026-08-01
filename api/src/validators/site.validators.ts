import { z } from 'zod'

const domainRegex = /^(localhost|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/

export const domainSchema = z.string()
  .min(1, 'Domain is required')
  .regex(domainRegex, 'Must be a valid domain (e.g. example.com)')

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(30, 'Name must be 30 characters or less'),
  domain: domainSchema,
})

export const updateSiteSchema = z.object({
  name: z.string().min(1).max(30, 'Name must be 30 characters or less').optional(),
  domain: domainSchema.optional(),
})

export const updateBannedWordsSchema = z.object({
  bannedWords: z.array(z.string()).optional(),
  autoDeleteBannedWords: z.boolean().optional(),
})
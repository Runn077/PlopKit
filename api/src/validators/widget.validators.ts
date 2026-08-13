import { z } from 'zod'
import { WidgetType } from '../generated/prisma/enums.js'

export const createWidgetSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  type: z.enum(WidgetType),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
})

export const updateWidgetSchema = z.object({
  name: z.string().min(1).max(100, 'Name must be 100 characters or less').optional(),
  autoApprove: z.boolean().optional(),
})

export const getWidgetConfigSchema = z.object({
  widget_key: z.string().min(1, 'widget_key is required'),
})
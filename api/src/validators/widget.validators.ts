import { z } from 'zod'
import { WidgetType } from '../generated/prisma/enums.js'

export const createWidgetSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  type: z.nativeEnum(WidgetType),
  name: z.string().min(1, 'Name is required'),
})

export const updateWidgetSchema = z.object({
  name: z.string().min(1).optional(),
  autoApprove: z.boolean().optional(),
})
import { z } from 'zod'
import { CommentStatus, WidgetType } from '../generated/prisma/enums.js'
import { domainSchema } from './site.validators.js'

const exportCommentSchema = z.object({
  id: z.string(),
  widgetKey: z.string(),
  parentId: z.string().nullable(),
  quotedId: z.string().nullable(),
  pageUrl: z.string(),
  body: z.string().max(10_000),
  status: z.enum(CommentStatus),
  isOwnerReply: z.boolean(),
  authorName: z.string().max(200),
  commenterDisplayId: z.string().nullable(),
  createdAt: z.string(),
})

const exportWidgetSchema = z.object({
  id: z.string(),
  name: z.string().max(200),
  widgetKey: z.string(),
  type: z.enum(WidgetType),
  createdAt: z.string(),
})

const exportDataSchema = z.object({
  schemaVersion: z.literal(1, { message: "This doesn't look like a valid PlopKit export file" }),
  site: z.object({ name: z.string(), domain: z.string() }),
  widgets: z.array(exportWidgetSchema).max(1000, {
    message: 'This export has too many widgets to import (max 1000)',
  }),
  comments: z.array(exportCommentSchema).max(20_000, {
    message: 'This export has too many comments to import (max 20,000)',
  }),
})

export const importSiteSchema = z.object({
  name: z.string().min(1).max(200),
  domain: domainSchema,
  data: z.unknown(),
}).superRefine((val, ctx) => {
  if (typeof val.data !== 'object' || val.data === null || Array.isArray(val.data)) {
    ctx.addIssue({
      code: 'custom',
      path: ['data'],
      message: "This doesn't look like a valid PlopKit export file",
    })
    return
  }

  const parsed = exportDataSchema.safeParse(val.data)
  if (!parsed.success) {
    ctx.addIssue({
      code: 'custom',
      path: ['data'],
      message: parsed.error.issues[0]?.message ?? 'Invalid export file',
    })
  }
})
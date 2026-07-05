import prisma from '../lib/prisma.js'
import { AppError } from '../errors/appError.js'
import { createSite } from './site.service.js'
import { CommentStatus, WidgetType } from '../generated/prisma/enums.js'
import { randomBytes } from 'crypto'

interface ExportComment {
  id: string
  widgetKey: string
  parentId: string | null
  quotedId: string | null
  pageUrl: string
  body: string
  status: CommentStatus
  isOwnerReply: boolean
  authorName: string
  commenterDisplayId: string | null
  createdAt: string
}

interface ExportWidget {
  id: string
  name: string
  widgetKey: string
  type: WidgetType
  createdAt: string
}

interface ExportData {
  schemaVersion: number
  site: { name: string; domain: string }
  widgets: ExportWidget[]
  comments: ExportComment[]
}

export async function importSite(userId: string, name: string, domain: string, data: ExportData) {
  if (data.schemaVersion !== 1) {
    throw new AppError(400, `Unsupported export schemaVersion: ${data.schemaVersion}`)
  }

  const site = await createSite(userId, name, domain)

  const widgetMap = new Map<string, { widgetKey: string; commentWidgetId: string }>()

  for (const w of data.widgets) {
    const newWidgetKey = randomBytes(16).toString('hex')

    const created = await prisma.widget.create({
      data: {
        siteId: site.id,
        type: w.type,
        name: w.name,
        widgetKey: newWidgetKey,
        createdAt: new Date(w.createdAt),
        ...(w.type === WidgetType.comments && {
          commentWidget: { create: { autoApprove: false } },
        }),
      },
      include: { commentWidget: true },
    })

    if (created.commentWidget) {
      widgetMap.set(w.widgetKey, {
        widgetKey: newWidgetKey,
        commentWidgetId: created.commentWidget.id,
      })
    }
  }

  const commentIdMap = new Map<string, string>() 

  for (const c of data.comments) {
    const mapped = widgetMap.get(c.widgetKey)
    if (!mapped) continue 

    const created = await prisma.comment.create({
      data: {
        commentWidgetId: mapped.commentWidgetId,
        widgetKey: mapped.widgetKey,
        pageUrl: c.pageUrl,
        body: c.body,
        status: c.status,
        isOwnerReply: c.isOwnerReply,
        authorName: c.authorName,
        commenterDisplayId: c.commenterDisplayId,
        createdAt: new Date(c.createdAt),
        parentId: c.parentId ? (commentIdMap.get(c.parentId) ?? null) : null,
        quotedId: c.quotedId ? (commentIdMap.get(c.quotedId) ?? null) : null,
      },
    })

    commentIdMap.set(c.id, created.id)
  }

  return site
}
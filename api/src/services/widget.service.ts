import { randomBytes } from 'crypto'
import prisma from '../lib/prisma.js'
import { AppError } from '../errors/appError.js'
import { WidgetType } from '../generated/prisma/enums.js'
import { PLAN_LIMITS } from '../constants/index.js'

export async function getWidgetOwnedByUser(widgetId: string, userId: string) {
  const widget = await prisma.widget.findUnique({
    where: { id: widgetId },
    include: { site: true, commentWidget: true },
  })
  if (!widget || widget.site.userId !== userId) throw new AppError(404, 'Widget not found')
  return widget
}

export async function getWidgetByKey(widgetKey: string) {
  return prisma.widget.findUnique({
    where: { widgetKey },
    include: { site: { include: { user: true } }, commentWidget: true },
  })
}

export async function getWidgetsBySite(siteId: string, userId: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')

  return prisma.widget.findMany({
    where: { siteId },
    orderBy: { createdAt: 'desc' },
    include: { commentWidget: true },
  })
}

export async function getWidgetById(widgetId: string, userId: string) {
  return getWidgetOwnedByUser(widgetId, userId)
}

export async function createWidget(
  siteId: string,
  userId: string,
  type: WidgetType,
  name: string,
) {
  const site = await prisma.site.findUnique({ where: { id: siteId } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')

  return prisma.widget.create({
    data: {
      siteId,
      type,
      name,
      widgetKey: randomBytes(16).toString('hex'),
      ...(type === WidgetType.comments && {
        commentWidget: {
          create: { autoApprove: false },
        },
      }),
    },
    include: { commentWidget: true },
  })
}

export async function updateWidget(widgetId: string, userId: string, data: { name?: string }) {
  await getWidgetOwnedByUser(widgetId, userId)
  return prisma.widget.update({
    where: { id: widgetId },
    data: { ...(data.name && { name: data.name }) },
    include: { commentWidget: true },
  })
}

export async function deleteWidget(widgetId: string, userId: string) {
  await getWidgetOwnedByUser(widgetId, userId)
  await prisma.widget.delete({ where: { id: widgetId } })
}

export async function trackWidgetLoad(widgetKey: string) {
  if (widgetKey === process.env.DEMO_WIDGET_KEY) return

  const widget = await getWidgetByKey(widgetKey)
  if (!widget) throw new AppError(404, 'Widget not found')

  const userId = widget.site.userId
  const userPlan = widget.site.user.plan
  const limit = PLAN_LIMITS[userPlan]

  const { _sum } = await prisma.widget.aggregate({
    _sum: { monthlyLoads: true },
    where: { site: { userId } },
  })

  const totalLoads = _sum.monthlyLoads ?? 0
  if (totalLoads >= limit) throw new AppError(429, 'Monthly load limit reached')

  await prisma.widget.update({
    where: { id: widget.id },
    data: { monthlyLoads: { increment: 1 } },
  })
}
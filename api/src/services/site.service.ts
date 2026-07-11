import { randomBytes } from 'crypto'
import prisma from '../lib/prisma.js'
import { AppError } from '../errors/appError.js'

export async function getSitesByUser(userId: string) {
  return prisma.site.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSiteById(id: string, userId: string) {
  const site = await prisma.site.findUnique({ where: { id } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')
  return site
}

export async function createSite(userId: string, name: string, domain: string) {
  const existing = await prisma.site.findUnique({ where: { domain } })
  if (existing?.verified) throw new AppError(409, 'This domain is already registered and verified')
  if (existing && existing.userId !== userId) {
    // Domain registered but unverified by someone else — allow re-registration by new user
    await prisma.site.delete({ where: { id: existing.id } })
  }
  if (existing && existing.userId === userId) {
    throw new AppError(409, 'You already have a site with this domain')
  }

  return prisma.site.create({
    data: {
      name,
      domain,
      siteKey: randomBytes(16).toString('hex'),
      userId,
      verified: false,
    },
  })
}

export async function updateSite(id: string, userId: string, data: { name?: string; domain?: string }) {
  const site = await prisma.site.findUnique({ where: { id } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')
  if (data.domain && data.domain !== site.domain) {
    const existing = await prisma.site.findUnique({ where: { domain: data.domain } })
    if (existing?.verified) throw new AppError(409, 'This domain is already registered and verified')
  }
  return prisma.site.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.domain && { domain: data.domain }),
    },
  })
}

export async function deleteSite(id: string, userId: string) {
  const site = await prisma.site.findUnique({ where: { id } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')
  await prisma.site.delete({ where: { id } })
}

export async function exportSite(id: string, userId: string) {
  const site = await getSiteById(id, userId)

  const widgets = await prisma.widget.findMany({
    where: { siteId: site.id },
    select: { id: true, name: true, widgetKey: true, type: true, createdAt: true },
  })

  const widgetKeys = widgets.map((w) => w.widgetKey)

  const comments = await prisma.comment.findMany({
    where: { widgetKey: { in: widgetKeys }, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      widgetKey: true,
      parentId: true,
      quotedId: true,
      pageUrl: true,
      body: true,
      status: true,
      isOwnerReply: true,
      authorName: true,
      commenterDisplayId: true,
      createdAt: true,
    },
  })

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    site: { id: site.id, name: site.name, domain: site.domain },
    widgets,
    comments,
  }
}

export async function updateBannedWords(
  id: string,
  userId: string,
  data: { bannedWords?: string[]; autoDeleteBannedWords?: boolean },
) {
  const site = await prisma.site.findUnique({ where: { id } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')

  return prisma.site.update({
    where: { id },
    data: {
      ...(data.bannedWords !== undefined && { bannedWords: data.bannedWords }),
      ...(data.autoDeleteBannedWords !== undefined && { autoDeleteBannedWords: data.autoDeleteBannedWords }),
    },
  })
}
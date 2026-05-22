import { randomBytes } from 'crypto'
import prisma from '../lib/prisma.js'
import { AppError } from '../errors/appError.js'
import { LIMITS } from '../constants/index.js'

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
  if (existing) throw new AppError(409, 'This domain is already registered')

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + LIMITS.SITE_EXPIRY_DAYS)

  return prisma.site.create({
    data: {
      name,
      domain,
      siteKey: randomBytes(16).toString('hex'),
      userId,
      verified: false,
      expiresAt,
    },
  })
}

export async function updateSite(id: string, userId: string, data: { name?: string; domain?: string }) {
  const site = await prisma.site.findUnique({ where: { id } })
  if (!site || site.userId !== userId) throw new AppError(404, 'Site not found')

  if (data.domain && data.domain !== site.domain) {
    const existing = await prisma.site.findUnique({ where: { domain: data.domain } })
    if (existing) throw new AppError(409, 'This domain is already registered')
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
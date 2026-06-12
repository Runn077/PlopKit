import cron from 'node-cron'
import prisma from './prisma.js'
import { LIMITS } from '../constants/index.js'
import { CommentStatus } from '../generated/prisma/enums.js'

export function startScheduler() {
  // Permanently delete soft-deleted comments older than 7 days
  cron.schedule('0 0 * * *', async () => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - LIMITS.SOFT_DELETE_EXPIRY_DAYS)
    const deleted = await prisma.comment.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    })
    console.log(`[scheduler] Permanently deleted ${deleted.count} soft-deleted comments`)
  })

  // Permanently delete pending comments older than 30 days
  cron.schedule('0 0 * * *', async () => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - LIMITS.PENDING_EXPIRY_DAYS)
    const expired = await prisma.comment.deleteMany({
      where: { status: CommentStatus.pending, deletedAt: null, createdAt: { lt: cutoff } },
    })
    console.log(`[scheduler] Cleaned up ${expired.count} expired pending comments`)
  })

  // reset user monthly loads
  cron.schedule('0 0 * * *', async () => {
    const dueUsers = await prisma.user.findMany({
      where: { usageResetAt: { lte: new Date() } },
      select: { id: true },
    })

    const next = new Date()
    next.setDate(next.getDate() + 30)

    for (const user of dueUsers) {
      await prisma.$transaction([
        prisma.widget.updateMany({
          where: { site: { userId: user.id } },
          data: { monthlyLoads: 0 },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { usageResetAt: next },
        }),
      ])
    }

    console.log(`[scheduler] Reset usage for ${dueUsers.length} users`)
  })

  // Reset demo widget load count daily
  cron.schedule('0 0 * * *', async () => {
    const demoKey = process.env.DEMO_WIDGET_KEY
    if (!demoKey) return
    await prisma.widget.updateMany({
      where: { widgetKey: demoKey },
      data: { monthlyLoads: 0 },
    })
    console.log('[scheduler] Reset demo widget monthly loads')
  })
}
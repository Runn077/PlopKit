import cron from 'node-cron'
import prisma from './prisma.js'
import { LIMITS } from '../constants/index.js'
import { CommentStatus } from '../generated/prisma/enums.js'

export function startCoreScheduler() {
  // Permanently delete soft-deleted comments older than 7 days
  cron.schedule('* * * * *', async () => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - LIMITS.SOFT_DELETE_EXPIRY_DAYS)
    const deleted = await prisma.comment.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    })
    console.log(`[scheduler] Permanently deleted ${deleted.count} soft-deleted comments`)
  })

  // Permanently delete pending comments older than 30 days
  cron.schedule('* * * * *', async () => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - LIMITS.PENDING_EXPIRY_DAYS)
    const expired = await prisma.comment.deleteMany({
      where: { status: CommentStatus.pending, deletedAt: null, createdAt: { lt: cutoff } },
    })
    console.log(`[scheduler] Cleaned up ${expired.count} expired pending comments`)
  })
}
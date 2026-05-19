import cron from 'node-cron'
import prisma from './prisma.js'

export function startCommentCronJobs() {
  cron.schedule('0 0 * * *', async () => {
    // Permanently delete soft deleted comments older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const deletedComments = await prisma.comment.deleteMany({
      where: {
        deletedAt: { lt: sevenDaysAgo },
      },
    })
    console.log(`Permanently deleted ${deletedComments.count} soft deleted comments`)

    // Permanently delete pending comments older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const expiredPending = await prisma.comment.deleteMany({
      where: {
        status: 'pending',
        deletedAt: null,
        createdAt: { lt: thirtyDaysAgo },
      },
    })
    console.log(`Cleaned up ${expiredPending.count} expired pending comments`)
  })
}
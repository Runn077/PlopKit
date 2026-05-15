import cron from 'node-cron'
import prisma from './prisma.js'

export function startCronJobs() {
  cron.schedule('0 0 * * *', async () => {
    const deleted = await prisma.site.deleteMany({
      where: {
        verified: false,
        expiresAt: { lt: new Date() },
      },
    })
    console.log(`Cleaned up ${deleted.count} expired unverified sites`)
  })
}
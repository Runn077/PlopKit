import cron from 'node-cron'
import prisma from '../lib/prisma.js'

export function startCloudScheduler() {
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
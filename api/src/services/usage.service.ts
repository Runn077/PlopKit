import prisma from '../lib/prisma.js'
import { getWidgetLoadStats } from './widget.service.js'
import { PLAN_LIMITS } from '../constants/cloud.js'

export async function getUsage(userId: string, plan: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pendingPlan: true, usageResetAt: true },
  })
  const { monthlyLoads } = await getWidgetLoadStats(userId)
  return {
    plan,
    pendingPlan: user?.pendingPlan ?? null,
    monthlyLoads,
    limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
    usageResetAt: user?.usageResetAt ?? null,
  }
}
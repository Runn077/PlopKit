import prisma from '../lib/prisma.js'
import { PLAN_LIMITS } from '../constants/index.js'

export async function getUsage(userId: string, plan: string) {
  const { _sum } = await prisma.commentWidget.aggregate({
    _sum: { monthlyLoads: true },
    where: { widget: { site: { userId } } },
  })

  return {
    plan,
    monthlyLoads: _sum.monthlyLoads ?? 0,
    limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
  }
}

export async function getAccountMeta(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId },
  })
  return { provider: account?.providerId ?? null }
}

export async function updateName(userId: string, name: string) {
  await prisma.user.update({ where: { id: userId }, data: { name } })
}

export async function deleteAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } })
}
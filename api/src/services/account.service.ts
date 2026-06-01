import prisma from '../lib/prisma.js'
import { PLAN_LIMITS } from '../constants/index.js'

export async function getUsage(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('User not found')

  const { _sum } = await prisma.commentWidget.aggregate({
    _sum: { monthlyLoads: true },
    where: { widget: { site: { userId } } },
  })

  return {
    plan: user.plan,
    monthlyLoads: _sum.monthlyLoads ?? 0,
    limit: PLAN_LIMITS[user.plan],
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
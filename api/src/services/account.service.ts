import prisma from '../lib/prisma.js'
import { PLAN_LIMITS } from '../constants/index.js'
import { sendAccountDeletedEmail } from '../emails/index.js'

export async function getUsage(userId: string, plan: string) {
  const { _sum } = await prisma.widget.aggregate({
    _sum: { monthlyLoads: true },
    where: { site: { userId } },
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  })

  await prisma.user.delete({ where: { id: userId } })

  if (user) {
    try {
      await sendAccountDeletedEmail(user.email, user.name ?? 'there')
    } catch (err) {
      console.error('Failed to send account deleted email:', err)
    }
  }
}
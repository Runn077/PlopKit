import prisma from '../lib/prisma.js'
import { PLAN_LIMITS } from '../constants/index.js'
import { sendAccountDeletedEmail } from '../emails/index.js'
import { AppError } from '../errors/appError.js'
import stripe from '../lib/stripe.js'

export async function getUsage(userId: string, plan: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pendingPlan: true, usageResetAt: true },
  })

  const { _sum } = await prisma.widget.aggregate({
    _sum: { monthlyLoads: true },
    where: { site: { userId } },
  })

  return {
    plan,
    pendingPlan: user?.pendingPlan ?? null,
    monthlyLoads: _sum.monthlyLoads ?? 0,
    limit: PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS],
    usageResetAt: user?.usageResetAt ?? null,
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
    select: { email: true, name: true, stripeCustomerId: true },
  })
  if (!user) throw new AppError(404, 'User not found')

  if (user.stripeCustomerId) {
    const subscriptions = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 1 })
    const subscription = subscriptions.data[0]
    if (subscription) {
      await stripe.subscriptions.cancel(subscription.id)
    }
  }

  await prisma.user.delete({ where: { id: userId } })

  try {
    await sendAccountDeletedEmail(user.email, user.name ?? 'there')
  } catch (err) {
    console.error('Failed to send account deleted email:', err)
  }
}
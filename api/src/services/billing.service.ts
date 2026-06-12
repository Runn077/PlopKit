import prisma from '../lib/prisma.js'
import stripe from '../lib/stripe.js'
import { AppError } from '../errors/appError.js'

const PRICE_IDS: Record<string, string> = {
  hobby: process.env.STRIPE_HOBBY_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

async function getActiveSubscription(stripeCustomerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  })
  return subscriptions.data[0] ?? null
}

export async function createCheckoutSession(userId: string, plan: 'hobby' | 'pro') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  if (user.plan !== 'free') {
    throw new AppError(400, 'You already have an active subscription. Use upgrade or downgrade instead.')
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new AppError(400, 'Invalid plan')

  const sessionParams: any = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    success_url: `${process.env.PLATFORM_URL}/account?upgrade=success`,
    cancel_url: `${process.env.PLATFORM_URL}/account?upgrade=cancelled`,
  }

  if (user.stripeCustomerId) {
    sessionParams.customer = user.stripeCustomerId
  } else {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return { url: session.url }
}

export async function upgradeSubscription(userId: string, plan: 'hobby' | 'pro') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.plan === 'free') throw new AppError(400, 'No active subscription to upgrade.')
  if (user.plan === plan) throw new AppError(400, 'You are already on this plan.')
  if (!user.stripeCustomerId) throw new AppError(404, 'No billing account found.')

  const subscription = await getActiveSubscription(user.stripeCustomerId)
  if (!subscription) throw new AppError(404, 'No active subscription found.')

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new AppError(400, 'Invalid plan')

  const subscriptionItem = subscription.items.data[0]
  if (!subscriptionItem) throw new AppError(400, 'No subscription item found.')

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscriptionItem.id, price: priceId }],
    proration_behavior: 'always_invoice',
  })

  const usageResetAt = new Date()
  usageResetAt.setDate(usageResetAt.getDate() + 30)

  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan as any, pendingPlan: null, usageResetAt },
  })

  return { success: true }
}

export async function downgradeSubscription(userId: string, plan: 'hobby') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.plan === 'free') throw new AppError(400, 'No active subscription to downgrade.')
  if (user.plan === plan) throw new AppError(400, 'You are already on this plan.')
  if (!user.stripeCustomerId) throw new AppError(404, 'No billing account found.')

  const subscription = await getActiveSubscription(user.stripeCustomerId)
  if (!subscription) throw new AppError(404, 'No active subscription found.')

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new AppError(400, 'Invalid plan')

  const subscriptionItem = subscription.items.data[0]
  if (!subscriptionItem) throw new AppError(400, 'No subscription item found.')

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscriptionItem.id, price: priceId }],
    proration_behavior: 'none',
    billing_cycle_anchor: 'unchanged',
    payment_behavior: 'pending_if_incomplete',
  })

  await prisma.user.update({
    where: { id: userId },
    data: { pendingPlan: plan as any },
  })

  return { success: true }
}

export async function cancelPendingDowngrade(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (!user.pendingPlan) throw new AppError(400, 'No pending downgrade to cancel.')
  if (!user.stripeCustomerId) throw new AppError(404, 'No billing account found.')

  const subscription = await getActiveSubscription(user.stripeCustomerId)
  if (!subscription) throw new AppError(404, 'No active subscription found.')

  const priceId = PRICE_IDS[user.plan]
  if (!priceId) throw new AppError(400, 'Invalid plan')

  const subscriptionItem = subscription.items.data[0]
  if (!subscriptionItem) throw new AppError(400, 'No subscription item found.')

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscriptionItem.id, price: priceId }],
    proration_behavior: 'none',
  })

  await prisma.user.update({
    where: { id: userId },
    data: { pendingPlan: null },
  })

  return { success: true }
}

export async function createPortalSession(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (!user.stripeCustomerId) throw new AppError(404, 'No billing account found')

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.PLATFORM_URL}/account`,
  })

  return { url: session.url }
}

export async function handleWebhook(payload: Buffer, signature: string) {
  let event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    throw new AppError(400, 'Invalid webhook signature')
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, plan } = session.metadata as { userId: string; plan: string }

    if (!userId || !plan) {
      console.warn('Webhook received checkout.session.completed with missing metadata, skipping.')
      return
    }

    const usageResetAt = new Date()
    usageResetAt.setDate(usageResetAt.getDate() + 30)

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan as any,
        pendingPlan: null,
        usageResetAt,
        stripeCustomerId: session.customer as string,
      },
    })
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    })

    if (user?.pendingPlan) {
      const previousAttributes = (event.data as any).previous_attributes
      if (previousAttributes?.current_period_start) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: user.pendingPlan, pendingPlan: null },
        })
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    })

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'free', pendingPlan: null },
      })
    }
  }
}
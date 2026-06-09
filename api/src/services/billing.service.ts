import prisma from '../lib/prisma.js'
import stripe from '../lib/stripe.js'
import { AppError } from '../errors/appError.js'

const PRICE_IDS: Record<string, string> = {
  hobby: process.env.STRIPE_HOBBY_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

async function getStripeCustomerAndSubscription(email: string) {
  const customers = await stripe.customers.list({ email, limit: 1 })
  const customer = customers.data[0]
  if (!customer) return { customer: null, subscription: null }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1,
  })
  const subscription = subscriptions.data[0] ?? null

  return { customer, subscription }
}

export async function createCheckoutSession(userId: string, plan: 'hobby' | 'pro') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  if (user.plan !== 'free') {
    throw new AppError(400, 'You already have an active subscription. Use upgrade or downgrade instead.')
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new AppError(400, 'Invalid plan')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    metadata: { userId, plan },
    success_url: `${process.env.PLATFORM_URL}/account?upgrade=success`,
    cancel_url: `${process.env.PLATFORM_URL}/account?upgrade=cancelled`,
  })

  return { url: session.url }
}

export async function upgradeSubscription(userId: string, plan: 'hobby' | 'pro') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.plan === 'free') throw new AppError(400, 'No active subscription to upgrade.')
  if (user.plan === plan) throw new AppError(400, 'You are already on this plan.')

  const { subscription } = await getStripeCustomerAndSubscription(user.email)
  if (!subscription) throw new AppError(404, 'No active subscription found.')

  const priceId = PRICE_IDS[plan]
  if (!priceId) throw new AppError(400, 'Invalid plan')

  const subscriptionItem = subscription.items.data[0]
  if (!subscriptionItem) throw new AppError(400, 'No subscription item found.')

  await stripe.subscriptions.update(subscription.id, {
    items: [{ id: subscriptionItem.id, price: priceId }],
    proration_behavior: 'always_invoice',
  })

  await prisma.user.update({
    where: { id: userId },
    data: { plan: plan as any, pendingPlan: null },
  })

  return { success: true }
}

export async function downgradeSubscription(userId: string, plan: 'hobby') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')
  if (user.plan === 'free') throw new AppError(400, 'No active subscription to downgrade.')
  if (user.plan === plan) throw new AppError(400, 'You are already on this plan.')

  const { subscription } = await getStripeCustomerAndSubscription(user.email)
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

  const { subscription } = await getStripeCustomerAndSubscription(user.email)
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

  const customers = await stripe.customers.list({ email: user.email, limit: 1 })
  const customer = customers.data[0]
  if (!customer) throw new AppError(404, 'No billing account found')

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
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

    await prisma.user.update({
      where: { id: userId },
      data: { plan: plan as any, pendingPlan: null },
    })
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if ('email' in customer && customer.email) {
      const user = await prisma.user.findFirst({ where: { email: customer.email } })
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
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const customer = await stripe.customers.retrieve(subscription.customer as string)

    if ('email' in customer && customer.email) {
      const user = await prisma.user.findFirst({ where: { email: customer.email } })
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'free', pendingPlan: null },
        })
      }
    }
  }
}
import prisma from '../../lib/prisma.js'
import stripe from '../lib/stripe.js'
import { AppError } from '../../errors/appError.js'

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
  sessionParams.allow_promotion_codes = true

  if (user.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId)
      if (customer.deleted) {
        throw new Error('Customer deleted')
      }
      sessionParams.customer = user.stripeCustomerId
    } catch {
      // Stale/invalid customer ID, create a fresh one
      const newCustomer = await stripe.customers.create({ email: user.email })
      sessionParams.customer = newCustomer.id
    }
  } else {
    sessionParams.customer_email = user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return { url: session.url }
}

export async function upgradeSubscription(userId: string, plan: 'hobby' | 'pro', promoCode?: string) {
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

  const updateParams: any = {
    items: [{ id: subscriptionItem.id, price: priceId }],
    proration_behavior: 'always_invoice',
  }

  if (promoCode) {
    const promos = await stripe.promotionCodes.list({
      code: promoCode,
      active: true,
      limit: 1,
    })

    const promo = promos.data[0]

    if (!promo) {
      throw new AppError(400, 'Invalid promo code')
    }

    updateParams.discounts = [
      {
        promotion_code: promo.id,
      },
    ]
  }

  const updatedSubscription = await stripe.subscriptions.update(subscription.id, updateParams)
  
  const item = updatedSubscription.items.data[0]
  if (!item) {
    throw new AppError(500, 'No subscription item found.')
  }

  const usageResetAt = new Date(item.current_period_end * 1000)

  await prisma.$transaction([
    prisma.widget.updateMany({
      where: { site: {userId} },
      data: { monthlyLoads: 0 }
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: plan as any, pendingPlan: null, usageResetAt },
    })
  ])

  return {success: true}
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

    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    const item = subscription.items.data[0]
    if (!item) {
      throw new AppError(500, 'No subscription item found.')
    }

    const usageResetAt = new Date(item.current_period_end * 1000)

    await prisma.$transaction([
      prisma.widget.updateMany({
        where: { site: { userId }},
        data: { monthlyLoads: 0 },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          plan: plan as any,
          pendingPlan: null,
          usageResetAt,
          stripeCustomerId: session.customer as string,
        }
      })
    ])
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object
    if (invoice.billing_reason !== 'subscription_cycle') return

    const subscriptionId = invoice.parent?.subscription_details?.subscription as string
    if (!subscriptionId) return

    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string },
    })
    if (!user) return

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const item = subscription.items.data[0]
    if (!item) {
      throw new AppError(500, 'No subscription item found.')
    }

    const usageResetAt = new Date(item.current_period_end * 1000)

    if (user.pendingPlan) {
      await prisma.$transaction([
        prisma.widget.updateMany({
          where: { site: { userId: user.id } },
          data: { monthlyLoads: 0 },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { plan: user.pendingPlan, pendingPlan: null, usageResetAt },
        }),
      ])
      return
    }

    await prisma.$transaction([
      prisma.widget.updateMany({
        where: { site: { userId: user.id } },
        data: { monthlyLoads: 0 },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { usageResetAt },
      }),
    ])
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
    })
    if (!user) return

    const item = subscription.items.data[0]
    if (!item) {
      throw new AppError(500, 'No subscription item found.')
    }

    const usageResetAt = new Date(item.current_period_end * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { usageResetAt },
    })
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
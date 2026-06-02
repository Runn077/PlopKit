import prisma from '../lib/prisma.js'
import stripe from '../lib/stripe.js'
import { AppError } from '../errors/appError.js'

const PRICE_IDS = {
  hobby: process.env.STRIPE_HOBBY_PRICE_ID!,
  pro: process.env.STRIPE_PRO_PRICE_ID!,
}

export async function createCheckoutSession(userId: string, plan: 'hobby' | 'pro') {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, 'User not found')

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    customer_email: user.email,
    metadata: { userId, plan },
    success_url: `${process.env.PLATFORM_URL}/account?upgrade=success`,
    cancel_url: `${process.env.PLATFORM_URL}/account?upgrade=cancelled`,
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

    await prisma.user.update({
      where: { id: userId },
      data: { plan: plan as any },
    })
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    
    if ('email' in customer && customer.email) {
      const user = await prisma.user.findFirst({ where: { email: customer.email } })
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'free' },
        })
      }
    }
  }
}
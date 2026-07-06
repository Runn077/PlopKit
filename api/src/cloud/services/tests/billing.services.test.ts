import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { AppError } from '../../../errors/appError.js'

vi.mock('../../../lib/prisma.js', () => ({
  default: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    widget: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('../../lib/stripe.js', () => ({
  default: {
    subscriptions: { list: vi.fn(), update: vi.fn(), retrieve: vi.fn() },
    customers: { retrieve: vi.fn(), create: vi.fn() },
    checkout: { sessions: { create: vi.fn() } },
    promotionCodes: { list: vi.fn() },
    billingPortal: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  },
}))

let createCheckoutSession: typeof import('../billing.service.js').createCheckoutSession
let upgradeSubscription: typeof import('../billing.service.js').upgradeSubscription
let downgradeSubscription: typeof import('../billing.service.js').downgradeSubscription
let cancelPendingDowngrade: typeof import('../billing.service.js').cancelPendingDowngrade
let createPortalSession: typeof import('../billing.service.js').createPortalSession
let handleWebhook: typeof import('../billing.service.js').handleWebhook

let prisma: typeof import('../../../lib/prisma.js').default
let stripe: typeof import('../../lib/stripe.js').default

beforeAll(async () => {
  process.env.STRIPE_HOBBY_PRICE_ID = 'price_hobby_test'
  process.env.STRIPE_PRO_PRICE_ID = 'price_pro_test'
  process.env.PLATFORM_URL = 'http://localhost:5173'
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

  const billing = await import('../billing.service.js')
  createCheckoutSession = billing.createCheckoutSession
  upgradeSubscription = billing.upgradeSubscription
  downgradeSubscription = billing.downgradeSubscription
  cancelPendingDowngrade = billing.cancelPendingDowngrade
  createPortalSession = billing.createPortalSession
  handleWebhook = billing.handleWebhook

  prisma = (await import('../../../lib/prisma.js')).default
  stripe = (await import('../../lib/stripe.js')).default
})

beforeEach(() => {
  vi.clearAllMocks()
})

// --- createCheckoutSession ---

describe('createCheckoutSession', () => {
  it('throws 404 when the user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    await expect(createCheckoutSession('user_1', 'hobby')).rejects.toThrow(AppError)
  })

  it('throws when the user already has a non-free plan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'pro' } as any)
    await expect(createCheckoutSession('user_1', 'hobby')).rejects.toThrow(
      'You already have an active subscription. Use upgrade or downgrade instead.'
    )
  })

  it('uses customer_email when the user has no stripeCustomerId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'free',
      stripeCustomerId: null,
      email: 'ru@example.com',
    } as any)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout' } as any)

    await createCheckoutSession('user_1', 'hobby')

    const callArg = vi.mocked(stripe.checkout.sessions.create).mock.calls[0]![0] as any
    expect(callArg.customer_email).toBe('ru@example.com')
    expect(callArg.customer).toBeUndefined()
    expect(callArg.line_items[0].price).toBe('price_hobby_test')
  })

  it('reuses an existing valid stripeCustomerId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'free',
      stripeCustomerId: 'cus_existing',
      email: 'ru@example.com',
    } as any)
    vi.mocked(stripe.customers.retrieve).mockResolvedValue({ deleted: false } as any)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout' } as any)

    await createCheckoutSession('user_1', 'pro')

    const callArg = vi.mocked(stripe.checkout.sessions.create).mock.calls[0]![0] as any
    expect(callArg.customer).toBe('cus_existing')
    expect(callArg.line_items[0].price).toBe('price_pro_test')
  })

  it('creates a fresh customer when the stored one was deleted', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'free',
      stripeCustomerId: 'cus_deleted',
      email: 'ru@example.com',
    } as any)
    vi.mocked(stripe.customers.retrieve).mockResolvedValue({ deleted: true } as any)
    vi.mocked(stripe.customers.create).mockResolvedValue({ id: 'cus_new' } as any)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout' } as any)

    await createCheckoutSession('user_1', 'hobby')

    expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'ru@example.com' })
    const callArg = vi.mocked(stripe.checkout.sessions.create).mock.calls[0]![0] as any
    expect(callArg.customer).toBe('cus_new')
  })

  it('creates a fresh customer when retrieving the stored one throws', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'free',
      stripeCustomerId: 'cus_stale',
      email: 'ru@example.com',
    } as any)
    vi.mocked(stripe.customers.retrieve).mockRejectedValue(new Error('No such customer'))
    vi.mocked(stripe.customers.create).mockResolvedValue({ id: 'cus_new' } as any)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout' } as any)

    await createCheckoutSession('user_1', 'hobby')

    expect(stripe.customers.create).toHaveBeenCalledWith({ email: 'ru@example.com' })
  })

  it('returns the checkout session url', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'free',
      stripeCustomerId: null,
      email: 'ru@example.com',
    } as any)
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ url: 'https://checkout.stripe.com/xyz' } as any)

    const result = await createCheckoutSession('user_1', 'hobby')
    expect(result).toEqual({ url: 'https://checkout.stripe.com/xyz' })
  })
})

// --- upgradeSubscription ---

describe('upgradeSubscription', () => {
  const activeUser = {
    plan: 'hobby',
    stripeCustomerId: 'cus_1',
  }

  it('throws 404 when the user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    await expect(upgradeSubscription('user_1', 'pro')).rejects.toThrow(AppError)
  })

  it('throws when the user is on the free plan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'free' } as any)
    await expect(upgradeSubscription('user_1', 'pro')).rejects.toThrow(
      'No active subscription to upgrade.'
    )
  })

  it('throws when the user is already on the target plan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'pro', stripeCustomerId: 'cus_1' } as any)
    await expect(upgradeSubscription('user_1', 'pro')).rejects.toThrow(
      'You are already on this plan.'
    )
  })

  it('throws when there is no stripeCustomerId', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'hobby', stripeCustomerId: null } as any)
    await expect(upgradeSubscription('user_1', 'pro')).rejects.toThrow('No billing account found.')
  })

  it('throws when there is no active Stripe subscription', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({ data: [] } as any)
    await expect(upgradeSubscription('user_1', 'pro')).rejects.toThrow('No active subscription found.')
  })

  it('throws when a promo code does not resolve to any active promotion', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({ data: [] } as any)

    await expect(upgradeSubscription('user_1', 'pro', 'BADCODE')).rejects.toThrow('Invalid promo code')
  })

  it('applies a valid promo code as a discount on the update', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.promotionCodes.list).mockResolvedValue({ data: [{ id: 'promo_1' }] } as any)
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({
      items: { data: [{ current_period_end: 1750000000 }] },
    } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    await upgradeSubscription('user_1', 'pro', 'GOODCODE')

    const updateArg = vi.mocked(stripe.subscriptions.update).mock.calls[0]![1] as any
    expect(updateArg.discounts).toEqual([{ promotion_code: 'promo_1' }])
  })

  it('reads usageResetAt from items.data[0].current_period_end on the updated subscription', async () => {
    // Locks in the correct field location after the Stripe SDK change —
    // NOT subscription.current_period_end.
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({
      items: { data: [{ current_period_end: 1750000000 }] },
    } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    await upgradeSubscription('user_1', 'pro')

    const transactionArg = vi.mocked(prisma.$transaction).mock.calls[0]![0]
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { plan: 'pro', pendingPlan: null, usageResetAt: new Date(1750000000 * 1000) },
    })
  })

  it('resets monthlyLoads to 0 for the user widgets and updates plan atomically', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(activeUser as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({
      items: { data: [{ current_period_end: 1750000000 }] },
    } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    await upgradeSubscription('user_1', 'pro')

    expect(prisma.widget.updateMany).toHaveBeenCalledWith({
      where: { site: { userId: 'user_1' } },
      data: { monthlyLoads: 0 },
    })
    expect(prisma.$transaction).toHaveBeenCalled()
  })
})

// --- downgradeSubscription ---

describe('downgradeSubscription', () => {
  it('throws when the user is on the free plan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'free' } as any)
    await expect(downgradeSubscription('user_1', 'hobby')).rejects.toThrow(
      'No active subscription to downgrade.'
    )
  })

  it('throws when already on the target plan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'hobby', stripeCustomerId: 'cus_1' } as any)
    await expect(downgradeSubscription('user_1', 'hobby')).rejects.toThrow(
      'You are already on this plan.'
    )
  })

  it('sets pendingPlan without touching plan directly', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'pro', stripeCustomerId: 'cus_1' } as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    await downgradeSubscription('user_1', 'hobby')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { pendingPlan: 'hobby' },
    })
  })

  it('schedules the Stripe update with proration none and unchanged billing anchor', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'pro', stripeCustomerId: 'cus_1' } as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    await downgradeSubscription('user_1', 'hobby')

    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_1', expect.objectContaining({
      proration_behavior: 'none',
      billing_cycle_anchor: 'unchanged',
    }))
  })
})

// --- cancelPendingDowngrade ---

describe('cancelPendingDowngrade', () => {
  it('throws when there is no pending downgrade', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ pendingPlan: null } as any)
    await expect(cancelPendingDowngrade('user_1')).rejects.toThrow('No pending downgrade to cancel.')
  })

  it('reverts the Stripe item back to the current plan price and clears pendingPlan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      plan: 'pro',
      pendingPlan: 'hobby',
      stripeCustomerId: 'cus_1',
    } as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_1', items: { data: [{ id: 'si_1' }] } }],
    } as any)
    vi.mocked(stripe.subscriptions.update).mockResolvedValue({} as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    await cancelPendingDowngrade('user_1')

    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_1', expect.objectContaining({
      items: [{ id: 'si_1', price: 'price_pro_test' }],
    }))
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { pendingPlan: null },
    })
  })
})

// --- createPortalSession ---

describe('createPortalSession', () => {
  it('throws when the user has no billing account', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ stripeCustomerId: null } as any)
    await expect(createPortalSession('user_1')).rejects.toThrow('No billing account found')
  })

  it('returns the portal session url', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ stripeCustomerId: 'cus_1' } as any)
    vi.mocked(stripe.billingPortal.sessions.create).mockResolvedValue({ url: 'https://portal' } as any)

    const result = await createPortalSession('user_1')
    expect(result).toEqual({ url: 'https://portal' })
  })
})

// --- handleWebhook ---

describe('handleWebhook', () => {
  it('throws 400 when the webhook signature is invalid', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
      throw new Error('bad signature')
    })
    await expect(handleWebhook(Buffer.from('payload'), 'bad_sig')).rejects.toThrow(
      'Invalid webhook signature'
    )
  })

  it('skips checkout.session.completed when metadata is missing', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { metadata: {} } },
    } as any)

    await expect(handleWebhook(Buffer.from('x'), 'sig')).resolves.not.toThrow()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('activates the plan on checkout.session.completed with valid metadata', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user_1', plan: 'hobby' },
          subscription: 'sub_1',
          customer: 'cus_1',
        },
      },
    } as any)
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      items: { data: [{ current_period_end: 1750000000 }] },
    } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    await handleWebhook(Buffer.from('x'), 'sig')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: {
        plan: 'hobby',
        pendingPlan: null,
        usageResetAt: new Date(1750000000 * 1000),
        stripeCustomerId: 'cus_1',
      },
    })
  })

  it('ignores invoice.paid events that are not subscription_cycle renewals', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.paid',
      data: { object: { billing_reason: 'manual' } },
    } as any)

    await handleWebhook(Buffer.from('x'), 'sig')
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
  })

  it('reads the subscription id from invoice.parent.subscription_details.subscription on renewal', async () => {
    // Locks in the correct (post-SDK-change) field path for invoice->subscription.
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          billing_reason: 'subscription_cycle',
          customer: 'cus_1',
          parent: { subscription_details: { subscription: 'sub_1' } },
        },
      },
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_1', pendingPlan: null } as any)
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      items: { data: [{ current_period_end: 1750000000 }] },
    } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    await handleWebhook(Buffer.from('x'), 'sig')

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_1')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { usageResetAt: new Date(1750000000 * 1000) },
    })
  })

  it('promotes a pendingPlan to plan on renewal and clears pendingPlan', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          billing_reason: 'subscription_cycle',
          customer: 'cus_1',
          parent: { subscription_details: { subscription: 'sub_1' } },
        },
      },
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_1', pendingPlan: 'hobby' } as any)
    vi.mocked(stripe.subscriptions.retrieve).mockResolvedValue({
      items: { data: [{ current_period_end: 1750000000 }] },
    } as any)
    vi.mocked(prisma.$transaction).mockResolvedValue([] as any)

    await handleWebhook(Buffer.from('x'), 'sig')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { plan: 'hobby', pendingPlan: null, usageResetAt: new Date(1750000000 * 1000) },
    })
  })

  it('updates usageResetAt on customer.subscription.updated', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_1',
          items: { data: [{ current_period_end: 1750000000 }] },
        },
      },
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_1' } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    await handleWebhook(Buffer.from('x'), 'sig')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { usageResetAt: new Date(1750000000 * 1000) },
    })
  })

  it('reverts the user to the free plan on customer.subscription.deleted', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_1' } },
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user_1' } as any)
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)

    await handleWebhook(Buffer.from('x'), 'sig')

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { plan: 'free', pendingPlan: null },
    })
  })

  it('does nothing on customer.subscription.deleted if no matching user is found', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockReturnValue({
      type: 'customer.subscription.deleted',
      data: { object: { customer: 'cus_unknown' } },
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    await handleWebhook(Buffer.from('x'), 'sig')
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})
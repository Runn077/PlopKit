import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AppError } from '../../errors/appError.js'

vi.mock('../../lib/prisma.js', () => ({
  default: {
    account: { findFirst: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

vi.mock('../../emails/index.js', () => ({
  sendAccountDeletedEmail: vi.fn(),
}))

vi.mock('../../cloud/lib/stripe.js', () => ({
  default: {
    subscriptions: { list: vi.fn(), cancel: vi.fn() },
  },
}))

import prisma from '../../lib/prisma.js'
import { sendAccountDeletedEmail } from '../../emails/index.js'
import stripe from '../../cloud/lib/stripe.js'
import { getAccountMeta, updateName, deleteAccount } from '../account.service.js'

const originalEnableCloud = process.env.ENABLE_CLOUD

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  process.env.ENABLE_CLOUD = originalEnableCloud
})

describe('getAccountMeta', () => {
  it('returns the providerId when an account exists', async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue({ providerId: 'google' } as any)
    const result = await getAccountMeta('user_1')
    expect(result).toEqual({ provider: 'google' })
  })

  it('returns null when no account exists', async () => {
    vi.mocked(prisma.account.findFirst).mockResolvedValue(null)
    const result = await getAccountMeta('user_1')
    expect(result).toEqual({ provider: null })
  })
})

describe('updateName', () => {
  it('calls prisma.user.update with the correct id and name', async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as any)
    await updateName('user_1', 'New Name')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { name: 'New Name' },
    })
  })
})

describe('deleteAccount', () => {
  it('throws a 404 AppError when the user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    await expect(deleteAccount('missing_user')).rejects.toThrow(AppError)
  })

  it('deletes the user and sends the account-deleted email', async () => {
    process.env.ENABLE_CLOUD = 'false'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: 'Ru',
      stripeCustomerId: null,
    } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

    await deleteAccount('user_1')

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user_1' } })
    expect(sendAccountDeletedEmail).toHaveBeenCalledWith('ru@example.com', 'Ru')
  })

  it('falls back to "there" when the user has no name', async () => {
    process.env.ENABLE_CLOUD = 'false'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: null,
      stripeCustomerId: null,
    } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

    await deleteAccount('user_1')

    expect(sendAccountDeletedEmail).toHaveBeenCalledWith('ru@example.com', 'there')
  })

  it('does not call Stripe when ENABLE_CLOUD is not the exact string "true"', async () => {
    process.env.ENABLE_CLOUD = 'false'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: 'Ru',
      stripeCustomerId: 'cus_123',
    } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

    await deleteAccount('user_1')

    expect(stripe.subscriptions.list).not.toHaveBeenCalled()
  })

  it('does not call Stripe when ENABLE_CLOUD is true but the user has no stripeCustomerId', async () => {
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: 'Ru',
      stripeCustomerId: null,
    } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

    await deleteAccount('user_1')

    expect(stripe.subscriptions.list).not.toHaveBeenCalled()
  })

  it('cancels an active Stripe subscription when ENABLE_CLOUD is true and a subscription exists', async () => {
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: 'Ru',
      stripeCustomerId: 'cus_123',
    } as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({
      data: [{ id: 'sub_123' }],
    } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

    await deleteAccount('user_1')

    expect(stripe.subscriptions.list).toHaveBeenCalledWith({ customer: 'cus_123', limit: 1 })
    expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
  })

  it('does not attempt to cancel when Stripe returns no subscriptions', async () => {
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: 'Ru',
      stripeCustomerId: 'cus_123',
    } as any)
    vi.mocked(stripe.subscriptions.list).mockResolvedValue({ data: [] } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)

    await deleteAccount('user_1')

    expect(stripe.subscriptions.cancel).not.toHaveBeenCalled()
  })

  it('still deletes the user even if sending the deleted-account email fails', async () => {
    process.env.ENABLE_CLOUD = 'false'
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: 'ru@example.com',
      name: 'Ru',
      stripeCustomerId: null,
    } as any)
    vi.mocked(prisma.user.delete).mockResolvedValue({} as any)
    vi.mocked(sendAccountDeletedEmail).mockRejectedValue(new Error('SMTP down'))

    await expect(deleteAccount('user_1')).resolves.not.toThrow()
    expect(prisma.user.delete).toHaveBeenCalled()
  })
})
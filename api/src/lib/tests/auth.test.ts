import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

vi.mock('better-auth', () => ({
  betterAuth: vi.fn((config) => config),
}))

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: vi.fn(() => ({})),
}))

vi.mock('better-auth/plugins', () => ({
  magicLink: vi.fn((config) => config),
}))

vi.mock('../prisma.js', () => ({
  default: {
    user: { update: vi.fn() },
  },
}))

vi.mock('../../emails/index.js', () => ({
  sendWelcomeEmail: vi.fn(),
  sendMagicLinkEmail: vi.fn(),
}))

import { betterAuth } from 'better-auth'
import { magicLink } from 'better-auth/plugins'
import prisma from '../prisma.js'
import { sendWelcomeEmail, sendMagicLinkEmail } from '../../emails/index.js'

let authConfig: any
let magicLinkConfig: any

beforeAll(async () => {
  process.env.GOOGLE_CLIENT_ID = 'test_client_id'
  process.env.GOOGLE_CLIENT_SECRET = 'test_client_secret'
  process.env.BETTER_AUTH_SECRET = 'test_secret'
  process.env.BETTER_AUTH_URL = 'http://localhost:3000'
  process.env.PLATFORM_URL = 'http://localhost:5173'

  await import('../auth.js')

  authConfig = vi.mocked(betterAuth).mock.calls[0]![0]
  magicLinkConfig = vi.mocked(magicLink).mock.calls[0]![0]
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-15T00:00:00.000Z'))
})

describe('auth config — static shape', () => {
  it('defaults plan to "free" for new users', () => {
    expect(authConfig.user.additionalFields.plan.defaultValue).toBe('free')
  })

  it('trusts the configured PLATFORM_URL as an origin', () => {
    expect(authConfig.trustedOrigins).toContain('http://localhost:5173')
  })
})

describe('magicLink — sendMagicLink callback', () => {
  it('sends the magic link email with the given email and url', async () => {
    await magicLinkConfig.sendMagicLink({ email: 'ru@example.com', url: 'https://plopkit.com/verify?token=abc' })

    expect(sendMagicLinkEmail).toHaveBeenCalledWith('ru@example.com', 'https://plopkit.com/verify?token=abc')
  })
})

describe('databaseHooks.user.create.after', () => {
  const afterCreate = () => authConfig.databaseHooks.user.create.after

  it('sends a welcome email using the user\'s name', async () => {
    await afterCreate()({ id: 'user_1', email: 'ru@example.com', name: 'Ru' })
    expect(sendWelcomeEmail).toHaveBeenCalledWith('ru@example.com', 'Ru')
  })

  it('falls back to "there" when the user has no name', async () => {
    await afterCreate()({ id: 'user_1', email: 'ru@example.com', name: null })
    expect(sendWelcomeEmail).toHaveBeenCalledWith('ru@example.com', 'there')
  })

  it('sets usageResetAt to 30 days from account creation', async () => {
    await afterCreate()({ id: 'user_1', email: 'ru@example.com', name: 'Ru' })

    const expected = new Date('2026-07-15T00:00:00.000Z')
    expected.setDate(expected.getDate() + 30)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user_1' },
      data: { usageResetAt: expected },
    })
  })

  it('still sets usageResetAt even when sending the welcome email fails', async () => {
    vi.mocked(sendWelcomeEmail).mockRejectedValueOnce(new Error('SMTP down'))

    await expect(
      afterCreate()({ id: 'user_1', email: 'ru@example.com', name: 'Ru' })
    ).resolves.not.toThrow()

    expect(prisma.user.update).toHaveBeenCalled()
  })

  it('does not throw when updating usageResetAt fails', async () => {
    vi.mocked(prisma.user.update).mockRejectedValueOnce(new Error('DB down'))

    await expect(
      afterCreate()({ id: 'user_1', email: 'ru@example.com', name: 'Ru' })
    ).resolves.not.toThrow()
  })

  it('sets usageResetAt unconditionally, with no ENABLE_CLOUD gate', async () => {
    process.env.ENABLE_CLOUD = 'false'
    await afterCreate()({ id: 'user_1', email: 'ru@example.com', name: 'Ru' })
    expect(prisma.user.update).toHaveBeenCalled()
  })
})
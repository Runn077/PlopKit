import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/prisma.js', () => ({
  default: {
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('../../../services/widget.service.js', () => ({
  getWidgetLoadStats: vi.fn(),
}))

import prisma from '../../../lib/prisma.js'
import { getWidgetLoadStats } from '../../../services/widget.service.js'
import { PLAN_LIMITS } from '../../constants.js'
import { getUsage } from '../usage.service.js'

const plans = ['free', 'hobby', 'pro'] as const

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getUsage', () => {
  it('returns the correct limit for each known plan', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: null,
      usageResetAt: null,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    for (const plan of plans) {
      const result = await getUsage('user_1', plan)
      expect(result.limit).toBe(PLAN_LIMITS[plan])
      expect(result.plan).toBe(plan)
    }
  })

  it('returns the monthlyLoads value from getWidgetLoadStats', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: null,
      usageResetAt: null,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 42 } as any)

    const result = await getUsage('user_1', 'free')
    expect(result.monthlyLoads).toBe(42)
    expect(getWidgetLoadStats).toHaveBeenCalledWith('user_1')
  })

  it('returns pendingPlan when the user has one set', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: 'pro',
      usageResetAt: null,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    const result = await getUsage('user_1', 'free')
    expect(result.pendingPlan).toBe('pro')
  })

  it('returns null pendingPlan when the user has none set', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: null,
      usageResetAt: null,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    const result = await getUsage('user_1', 'free')
    expect(result.pendingPlan).toBeNull()
  })

  it('returns null pendingPlan and usageResetAt when the user record is not found', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    const result = await getUsage('user_1', 'free')
    expect(result.pendingPlan).toBeNull()
    expect(result.usageResetAt).toBeNull()
  })

  it('returns the usageResetAt date when present', async () => {
    const resetDate = new Date('2026-08-01T00:00:00.000Z')
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: null,
      usageResetAt: resetDate,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    const result = await getUsage('user_1', 'free')
    expect(result.usageResetAt).toBe(resetDate)
  })

  it('returns undefined limit for a plan not present in PLAN_LIMITS', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: null,
      usageResetAt: null,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    const result = await getUsage('user_1', 'not_a_real_plan')
    expect(result.limit).toBeUndefined()
  })

  it('queries prisma.user.findUnique with the correct userId and selected fields', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      pendingPlan: null,
      usageResetAt: null,
    } as any)
    vi.mocked(getWidgetLoadStats).mockResolvedValue({ monthlyLoads: 0 } as any)

    await getUsage('user_42', 'free')
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user_42' },
      select: { pendingPlan: true, usageResetAt: true },
    })
  })
})
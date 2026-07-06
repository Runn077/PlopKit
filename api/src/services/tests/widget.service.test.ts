import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AppError } from '../../errors/appError.js'
import { WidgetType } from '../../generated/prisma/enums.js'

vi.mock('../../lib/prisma.js', () => ({
  default: {
    widget: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    site: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({ toString: () => 'generated_widget_key' })),
}))

vi.mock('../../cloud/constants.js', () => ({
  PLAN_LIMITS: { free: 5_000, hobby: 150_000, pro: 500_000 },
}))

import prisma from '../../lib/prisma.js'
import {
  getWidgetOwnedByUser,
  getWidgetByKey,
  getWidgetsBySite,
  getWidgetById,
  createWidget,
  updateWidget,
  deleteWidget,
  getWidgetLoadStats,
  trackWidgetLoad,
} from '../widget.service.js'

const originalEnableCloud = process.env.ENABLE_CLOUD
const originalDemoKey = process.env.DEMO_WIDGET_KEY

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  process.env.ENABLE_CLOUD = originalEnableCloud
  process.env.DEMO_WIDGET_KEY = originalDemoKey
})

describe('getWidgetOwnedByUser', () => {
  it('throws 404 when the widget does not exist', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(null)
    await expect(getWidgetOwnedByUser('widget_1', 'user_1')).rejects.toThrow(AppError)
  })

  it('throws 404 when the widget belongs to a different user', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'other_user' },
    } as any)
    await expect(getWidgetOwnedByUser('widget_1', 'user_1')).rejects.toThrow('Widget not found')
  })

  it('returns the widget when owned by the requesting user', async () => {
    const widget = { id: 'widget_1', site: { userId: 'user_1' } }
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(widget as any)
    const result = await getWidgetOwnedByUser('widget_1', 'user_1')
    expect(result).toBe(widget)
  })
})

describe('getWidgetByKey', () => {
  it('queries by widgetKey and includes site.user and commentWidget', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({ id: 'widget_1' } as any)
    await getWidgetByKey('wk_123')
    expect(prisma.widget.findUnique).toHaveBeenCalledWith({
      where: { widgetKey: 'wk_123' },
      include: { site: { include: { user: true } }, commentWidget: true },
    })
  })
})

describe('getWidgetsBySite', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(getWidgetsBySite('site_1', 'user_1')).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(getWidgetsBySite('site_1', 'user_1')).rejects.toThrow('Site not found')
  })

  it('returns widgets for the site ordered by createdAt desc', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.widget.findMany).mockResolvedValue([] as any)

    await getWidgetsBySite('site_1', 'user_1')

    expect(prisma.widget.findMany).toHaveBeenCalledWith({
      where: { siteId: 'site_1' },
      orderBy: { createdAt: 'desc' },
      include: { commentWidget: true },
    })
  })
})

describe('getWidgetById', () => {
  it('delegates to getWidgetOwnedByUser', async () => {
    const widget = { id: 'widget_1', site: { userId: 'user_1' } }
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(widget as any)
    const result = await getWidgetById('widget_1', 'user_1')
    expect(result).toBe(widget)
  })
})

describe('createWidget', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(
      createWidget('site_1', 'user_1', WidgetType.comments, 'My Widget')
    ).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(
      createWidget('site_1', 'user_1', WidgetType.comments, 'My Widget')
    ).rejects.toThrow('Site not found')
  })

  it('generates a widgetKey and nests a commentWidget create for type comments', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({ id: 'widget_1' } as any)

    await createWidget('site_1', 'user_1', WidgetType.comments, 'My Widget')

    expect(prisma.widget.create).toHaveBeenCalledWith({
      data: {
        siteId: 'site_1',
        type: WidgetType.comments,
        name: 'My Widget',
        widgetKey: 'generated_widget_key',
        commentWidget: { create: { autoApprove: false } },
      },
      include: { commentWidget: true },
    })
  })
})

describe('updateWidget', () => {
  it('throws 404 when the widget is not owned by the user', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(null)
    await expect(updateWidget('widget_1', 'user_1', { name: 'New' })).rejects.toThrow(AppError)
  })

  it('updates the name when provided', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.update).mockResolvedValue({} as any)

    await updateWidget('widget_1', 'user_1', { name: 'Renamed' })

    expect(prisma.widget.update).toHaveBeenCalledWith({
      where: { id: 'widget_1' },
      data: { name: 'Renamed' },
      include: { commentWidget: true },
    })
  })

  it('sends an empty data object when no name is provided', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.update).mockResolvedValue({} as any)

    await updateWidget('widget_1', 'user_1', {})

    expect(prisma.widget.update).toHaveBeenCalledWith({
      where: { id: 'widget_1' },
      data: {},
      include: { commentWidget: true },
    })
  })
})

describe('deleteWidget', () => {
  it('throws 404 when the widget is not owned by the user', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(null)
    await expect(deleteWidget('widget_1', 'user_1')).rejects.toThrow(AppError)
  })

  it('deletes the widget when owned by the user', async () => {
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.delete).mockResolvedValue({} as any)

    await deleteWidget('widget_1', 'user_1')

    expect(prisma.widget.delete).toHaveBeenCalledWith({ where: { id: 'widget_1' } })
  })
})

describe('getWidgetLoadStats', () => {
  it('returns the summed monthlyLoads scoped to the user', async () => {
    vi.mocked(prisma.widget.aggregate).mockResolvedValue({ _sum: { monthlyLoads: 123 } } as any)

    const result = await getWidgetLoadStats('user_1')

    expect(result).toEqual({ monthlyLoads: 123 })
    expect(prisma.widget.aggregate).toHaveBeenCalledWith({
      _sum: { monthlyLoads: true },
      where: { site: { userId: 'user_1' } },
    })
  })

  it('returns 0 when the user has no widgets (sum is null)', async () => {
    vi.mocked(prisma.widget.aggregate).mockResolvedValue({ _sum: { monthlyLoads: null } } as any)

    const result = await getWidgetLoadStats('user_1')

    expect(result).toEqual({ monthlyLoads: 0 })
  })
})

describe('trackWidgetLoad', () => {
  it('does nothing when the widgetKey matches DEMO_WIDGET_KEY', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    await trackWidgetLoad('demo_key')
    expect(prisma.widget.findUnique).not.toHaveBeenCalled()
    expect(prisma.widget.update).not.toHaveBeenCalled()
  })

  it('throws 404 when the widget does not exist', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    vi.mocked(prisma.widget.findUnique).mockResolvedValue(null)
    await expect(trackWidgetLoad('unknown_key')).rejects.toThrow(AppError)
  })

  it('increments monthlyLoads without checking plan limits when ENABLE_CLOUD is not "true"', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    process.env.ENABLE_CLOUD = 'false'
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.update).mockResolvedValue({} as any)

    await trackWidgetLoad('wk_123')

    expect(prisma.widget.aggregate).not.toHaveBeenCalled()
    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(prisma.widget.update).toHaveBeenCalledWith({
      where: { id: 'widget_1' },
      data: { monthlyLoads: { increment: 1 } },
    })
  })

  it('allows the load and increments when ENABLE_CLOUD is true and under the plan limit', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.aggregate).mockResolvedValue({ _sum: { monthlyLoads: 100 } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'free' } as any)
    vi.mocked(prisma.widget.update).mockResolvedValue({} as any)

    await trackWidgetLoad('wk_123')

    expect(prisma.widget.update).toHaveBeenCalledWith({
      where: { id: 'widget_1' },
      data: { monthlyLoads: { increment: 1 } },
    })
  })

  it('throws 429 when ENABLE_CLOUD is true and monthlyLoads meets or exceeds the plan limit', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.aggregate).mockResolvedValue({ _sum: { monthlyLoads: 5_000 } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'free' } as any)

    await expect(trackWidgetLoad('wk_123')).rejects.toThrow('Monthly load limit reached')
    expect(prisma.widget.update).not.toHaveBeenCalled()
  })

  it('does not throw when monthlyLoads is exactly one below the plan limit', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.aggregate).mockResolvedValue({ _sum: { monthlyLoads: 4_999 } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: 'free' } as any)
    vi.mocked(prisma.widget.update).mockResolvedValue({} as any)

    await expect(trackWidgetLoad('wk_123')).resolves.not.toThrow()
  })

  it('does not throw when the user record is not found even with ENABLE_CLOUD true', async () => {
    process.env.DEMO_WIDGET_KEY = 'demo_key'
    process.env.ENABLE_CLOUD = 'true'
    vi.mocked(prisma.widget.findUnique).mockResolvedValue({
      id: 'widget_1',
      site: { userId: 'user_1' },
    } as any)
    vi.mocked(prisma.widget.aggregate).mockResolvedValue({ _sum: { monthlyLoads: 999_999 } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.widget.update).mockResolvedValue({} as any)

    await expect(trackWidgetLoad('wk_123')).resolves.not.toThrow()
    expect(prisma.widget.update).toHaveBeenCalled()
  })
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../errors/appError.js'

vi.mock('../../lib/prisma.js', () => ({
  default: {
    site: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    widget: { findMany: vi.fn() },
    comment: { findMany: vi.fn() },
  },
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({ toString: () => 'generated_site_key' })),
}))

import prisma from '../../lib/prisma.js'
import {
  getSitesByUser,
  getSiteById,
  createSite,
  updateSite,
  deleteSite,
  exportSite,
  updateBannedWords,
  updateTheme,
  updateAllowLocalhost,
} from '../site.service.js'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSitesByUser', () => {
  it('queries sites for the given userId ordered by createdAt desc', async () => {
    vi.mocked(prisma.site.findMany).mockResolvedValue([] as any)
    await getSitesByUser('user_1')
    expect(prisma.site.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      orderBy: { createdAt: 'desc' },
    })
  })
})

describe('getSiteById', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(getSiteById('site_1', 'user_1')).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(getSiteById('site_1', 'user_1')).rejects.toThrow('Site not found')
  })

  it('returns the site when it belongs to the requesting user', async () => {
    const site = { id: 'site_1', userId: 'user_1' }
    vi.mocked(prisma.site.findUnique).mockResolvedValue(site as any)
    const result = await getSiteById('site_1', 'user_1')
    expect(result).toBe(site)
  })
})

describe('createSite', () => {
  it('creates a new site with a generated siteKey', async () => {
    vi.mocked(prisma.site.create).mockResolvedValue({ id: 'site_new' } as any)

    await createSite('user_1', 'My Blog', 'example.com')

    expect(prisma.site.create).toHaveBeenCalledWith({
      data: {
        name: 'My Blog',
        domain: 'example.com',
        siteKey: 'generated_site_key',
        userId: 'user_1',
      },
    })
  })
})

describe('updateSite', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(updateSite('site_1', 'user_1', { name: 'New Name' })).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(updateSite('site_1', 'user_1', { name: 'New Name' })).rejects.toThrow('Site not found')
  })

  it('updates only the name when domain is not provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValueOnce({
      id: 'site_1',
      userId: 'user_1',
      domain: 'old.com',
    } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateSite('site_1', 'user_1', { name: 'New Name' })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { name: 'New Name' },
    })
  })

  it('updates only the domain when name is not provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValueOnce({
      id: 'site_1',
      userId: 'user_1',
      domain: 'old.com',
    } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateSite('site_1', 'user_1', { domain: 'new.com' })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { domain: 'new.com' },
    })
  })

  it('updates both name and domain when both are provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValueOnce({
      id: 'site_1',
      userId: 'user_1',
      domain: 'old.com',
    } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateSite('site_1', 'user_1', { name: 'New Name', domain: 'new.com' })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { name: 'New Name', domain: 'new.com' },
    })
  })
})

describe('deleteSite', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(deleteSite('site_1', 'user_1')).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(deleteSite('site_1', 'user_1')).rejects.toThrow('Site not found')
  })

  it('deletes the site when it belongs to the requesting user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.delete).mockResolvedValue({} as any)

    await deleteSite('site_1', 'user_1')

    expect(prisma.site.delete).toHaveBeenCalledWith({ where: { id: 'site_1' } })
  })
})

describe('exportSite', () => {
  it('throws 404 when the site does not belong to the requesting user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(exportSite('site_1', 'user_1')).rejects.toThrow(AppError)
  })

  it('scopes comments to only the widgets belonging to this site', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: 'site_1',
      userId: 'user_1',
      name: 'My Blog',
      domain: 'example.com',
    } as any)
    vi.mocked(prisma.widget.findMany).mockResolvedValue([
      { id: 'w1', name: 'Widget 1', widgetKey: 'key_1', type: 'comments', createdAt: new Date() },
    ] as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([] as any)

    await exportSite('site_1', 'user_1')

    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { widgetKey: { in: ['key_1'] }, deletedAt: null },
      })
    )
  })

  it('excludes soft-deleted comments from the export', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: 'site_1',
      userId: 'user_1',
      name: 'My Blog',
      domain: 'example.com',
    } as any)
    vi.mocked(prisma.widget.findMany).mockResolvedValue([] as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([] as any)

    await exportSite('site_1', 'user_1')

    const callArg = vi.mocked(prisma.comment.findMany).mock.calls[0]![0] as any
    expect(callArg.where.deletedAt).toBeNull()
  })

  it('returns schemaVersion 1 and the correct site/widgets/comments shape', async () => {
    const site = { id: 'site_1', userId: 'user_1', name: 'My Blog', domain: 'example.com' }
    vi.mocked(prisma.site.findUnique).mockResolvedValue(site as any)
    vi.mocked(prisma.widget.findMany).mockResolvedValue([{ id: 'w1' }] as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([{ id: 'c1' }] as any)

    const result = await exportSite('site_1', 'user_1')

    expect(result.schemaVersion).toBe(1)
    expect(result.site).toEqual({ id: 'site_1', name: 'My Blog', domain: 'example.com' })
    expect(result.widgets).toEqual([{ id: 'w1' }])
    expect(result.comments).toEqual([{ id: 'c1' }])
    expect(typeof result.exportedAt).toBe('string')
  })
})

describe('updateBannedWords', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(updateBannedWords('site_1', 'user_1', {})).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(updateBannedWords('site_1', 'user_1', {})).rejects.toThrow('Site not found')
  })

  it('only includes fields that were explicitly provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateBannedWords('site_1', 'user_1', { bannedWords: ['spam'] })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { bannedWords: ['spam'] },
    })
  })

  it('updates both fields when both are provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateBannedWords('site_1', 'user_1', { bannedWords: ['spam'], autoDeleteBannedWords: true })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { bannedWords: ['spam'], autoDeleteBannedWords: true },
    })
  })

  it('sends an empty data object when nothing is provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateBannedWords('site_1', 'user_1', {})

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: {},
    })
  })
})

describe('updateTheme', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(updateTheme('site_1', 'user_1', {})).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(updateTheme('site_1', 'user_1', {})).rejects.toThrow('Site not found')
  })

  it('updates the theme with tokens when provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    const theme = { tokens: { primary: '#000000', secondary: '#ffffff' } }
    await updateTheme('site_1', 'user_1', { theme })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { theme },
    })
  })

  it('sets theme to null when explicitly provided as null', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateTheme('site_1', 'user_1', { theme: null })

    expect(prisma.site.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'site_1' },
      })
    )
  })

  it('does not update theme when theme is not provided', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateTheme('site_1', 'user_1', {})

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: {},
    })
  })
})

describe('updateAllowLocalhost', () => {
  it('throws 404 when the site does not exist', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    await expect(updateAllowLocalhost('site_1', 'user_1', true)).rejects.toThrow(AppError)
  })

  it('throws 404 when the site belongs to a different user', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'other_user' } as any)
    await expect(updateAllowLocalhost('site_1', 'user_1', true)).rejects.toThrow('Site not found')
  })

  it('updates allowLocalhost to true', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateAllowLocalhost('site_1', 'user_1', true)

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { allowLocalhost: true },
    })
  })

  it('updates allowLocalhost to false', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({ id: 'site_1', userId: 'user_1' } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateAllowLocalhost('site_1', 'user_1', false)

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { allowLocalhost: false },
    })
  })
})

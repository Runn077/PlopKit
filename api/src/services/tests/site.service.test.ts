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
  it('creates a new site with a generated siteKey when the domain is unregistered', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.site.create).mockResolvedValue({ id: 'site_new' } as any)

    await createSite('user_1', 'My Blog', 'example.com')

    expect(prisma.site.create).toHaveBeenCalledWith({
      data: {
        name: 'My Blog',
        domain: 'example.com',
        siteKey: 'generated_site_key',
        userId: 'user_1',
        verified: false,
      },
    })
  })

  it('throws 409 when the domain is already registered and verified', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: 'existing_site',
      userId: 'other_user',
      verified: true,
    } as any)

    await expect(createSite('user_1', 'My Blog', 'example.com')).rejects.toThrow(
      'This domain is already registered and verified'
    )
    expect(prisma.site.delete).not.toHaveBeenCalled()
    expect(prisma.site.create).not.toHaveBeenCalled()
  })

  it('deletes an unverified site owned by a different user and creates a new one', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: 'existing_site',
      userId: 'other_user',
      verified: false,
    } as any)
    vi.mocked(prisma.site.delete).mockResolvedValue({} as any)
    vi.mocked(prisma.site.create).mockResolvedValue({ id: 'site_new' } as any)

    await createSite('user_1', 'My Blog', 'example.com')

    expect(prisma.site.delete).toHaveBeenCalledWith({ where: { id: 'existing_site' } })
    expect(prisma.site.create).toHaveBeenCalled()
  })

  it('throws 409 when the same user already has an unverified site with this domain', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValue({
      id: 'existing_site',
      userId: 'user_1',
      verified: false,
    } as any)

    await expect(createSite('user_1', 'My Blog', 'example.com')).rejects.toThrow(
      'You already have a site with this domain'
    )
    expect(prisma.site.delete).not.toHaveBeenCalled()
    expect(prisma.site.create).not.toHaveBeenCalled()
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

  it('does not re-check domain uniqueness when the domain is unchanged', async () => {
    vi.mocked(prisma.site.findUnique).mockResolvedValueOnce({
      id: 'site_1',
      userId: 'user_1',
      domain: 'example.com',
    } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateSite('site_1', 'user_1', { domain: 'example.com' })

    expect(prisma.site.findUnique).toHaveBeenCalledTimes(1)
  })

  it('throws 409 when changing to a domain already verified by another site', async () => {
    vi.mocked(prisma.site.findUnique)
      .mockResolvedValueOnce({ id: 'site_1', userId: 'user_1', domain: 'old.com' } as any)
      .mockResolvedValueOnce({ id: 'other_site', verified: true } as any)

    await expect(
      updateSite('site_1', 'user_1', { domain: 'taken.com' })
    ).rejects.toThrow('This domain is already registered and verified')
    expect(prisma.site.update).not.toHaveBeenCalled()
  })

  it('allows changing to a domain that is registered but unverified', async () => {
    vi.mocked(prisma.site.findUnique)
      .mockResolvedValueOnce({ id: 'site_1', userId: 'user_1', domain: 'old.com' } as any)
      .mockResolvedValueOnce({ id: 'other_site', verified: false } as any)
    vi.mocked(prisma.site.update).mockResolvedValue({} as any)

    await updateSite('site_1', 'user_1', { domain: 'unverified.com' })

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { domain: 'unverified.com' },
    })
  })

  it('updates both name and domain when both are provided and valid', async () => {
    vi.mocked(prisma.site.findUnique)
      .mockResolvedValueOnce({ id: 'site_1', userId: 'user_1', domain: 'old.com' } as any)
      .mockResolvedValueOnce(null)
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
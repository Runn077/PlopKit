import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../errors/appError.js'
import { WidgetType, CommentStatus } from '../../generated/prisma/enums.js'

vi.mock('../../lib/prisma.js', () => ({
  default: {
    widget: { create: vi.fn() },
    comment: { create: vi.fn() },
  },
}))

vi.mock('../site.service.js', () => ({
  createSite: vi.fn(),
}))

vi.mock('crypto', () => ({
  randomBytes: vi.fn(),
}))

import prisma from '../../lib/prisma.js'
import { createSite } from '../site.service.js'
import { randomBytes } from 'crypto'
import { importSite } from '../import.service.js'

beforeEach(() => {
  vi.clearAllMocks()
  let call = 0
  vi.mocked(randomBytes).mockImplementation(() => {
    call += 1
    return { toString: () => `generated_key_${call}` } as any
  })
})

const baseWidget = {
  id: 'old_widget_1',
  name: 'Main Widget',
  widgetKey: 'old_key_1',
  type: WidgetType.comments,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function makeComment(overrides: Partial<any> = {}) {
  return {
    id: 'old_comment_1',
    widgetKey: 'old_key_1',
    parentId: null,
    quotedId: null,
    pageUrl: '/blog/post-1',
    body: 'Great post!',
    status: CommentStatus.approved,
    isOwnerReply: false,
    authorName: 'Ru',
    commenterDisplayId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('importSite — schema version guard', () => {
  it('throws an AppError when schemaVersion is not 1', async () => {
    await expect(
      importSite('user_1', 'My Blog', 'example.com', {
        schemaVersion: 2,
        site: { name: 'x', domain: 'x.com' },
        widgets: [],
        comments: [],
      })
    ).rejects.toThrow(AppError)
    expect(createSite).not.toHaveBeenCalled()
  })
})

describe('importSite — site creation', () => {
  it('creates the site with the given userId, name, and domain', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [],
      comments: [],
    })

    expect(createSite).toHaveBeenCalledWith('user_1', 'My Blog', 'example.com')
  })

  it('returns the created site', async () => {
    const site = { id: 'site_new' }
    vi.mocked(createSite).mockResolvedValue(site as any)

    const result = await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [],
      comments: [],
    })

    expect(result).toBe(site)
  })
})

describe('importSite — widget creation', () => {
  it('generates a fresh widgetKey rather than reusing the export widgetKey', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [],
    })

    const callArg = vi.mocked(prisma.widget.create).mock.calls[0]![0] as any
    expect(callArg.data.widgetKey).not.toBe('old_key_1')
    expect(callArg.data.siteId).toBe('site_new')
    expect(callArg.data.name).toBe('Main Widget')
  })

  it('nests a commentWidget create for widgets of type comments', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [],
    })

    const callArg = vi.mocked(prisma.widget.create).mock.calls[0]![0] as any
    expect(callArg.data.commentWidget).toEqual({ create: { autoApprove: false } })
  })
})

describe('importSite — comment creation and widget-key mapping', () => {
  it('skips comments whose widgetKey has no matching imported widget', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [makeComment({ widgetKey: 'unknown_key' })],
    })

    expect(prisma.comment.create).not.toHaveBeenCalled()
  })

  it('creates a comment using the new commentWidgetId and new widgetKey for a matching widget', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({ id: 'new_comment_1' } as any)

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [makeComment()],
    })

    const callArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(callArg.data.commentWidgetId).toBe('cw_1')
    expect(callArg.data.widgetKey).not.toBe('old_key_1')
    expect(callArg.data.body).toBe('Great post!')
  })
})

describe('importSite — parentId and quotedId remapping', () => {
  it('remaps parentId to the new comment id when the parent was already created earlier in the array', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)
    vi.mocked(prisma.comment.create)
      .mockResolvedValueOnce({ id: 'new_parent' } as any)
      .mockResolvedValueOnce({ id: 'new_child' } as any)

    const parent = makeComment({ id: 'old_parent', parentId: null })
    const child = makeComment({ id: 'old_child', parentId: 'old_parent' })

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [parent, child],
    })

    const childCallArg = vi.mocked(prisma.comment.create).mock.calls[1]![0] as any
    expect(childCallArg.data.parentId).toBe('new_parent')
  })

  it('sets parentId to null when the referenced parent appears later in the array (not yet mapped)', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)
    vi.mocked(prisma.comment.create)
      .mockResolvedValueOnce({ id: 'new_child' } as any)
      .mockResolvedValueOnce({ id: 'new_parent' } as any)

    const child = makeComment({ id: 'old_child', parentId: 'old_parent' })
    const parent = makeComment({ id: 'old_parent', parentId: null })

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [child, parent],
    })

    const childCallArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(childCallArg.data.parentId).toBeNull()
  })

  it('sets quotedId to null when the quoted comment id does not exist in the map', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({ id: 'new_comment' } as any)

    const comment = makeComment({ quotedId: 'does_not_exist' })

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [comment],
    })

    const callArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(callArg.data.quotedId).toBeNull()
  })

  it('leaves parentId null when the original comment had no parentId', async () => {
    vi.mocked(createSite).mockResolvedValue({ id: 'site_new' } as any)
    vi.mocked(prisma.widget.create).mockResolvedValue({
      commentWidget: { id: 'cw_1' },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({ id: 'new_comment' } as any)

    await importSite('user_1', 'My Blog', 'example.com', {
      schemaVersion: 1,
      site: { name: 'x', domain: 'x.com' },
      widgets: [baseWidget],
      comments: [makeComment({ parentId: null })],
    })

    const callArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(callArg.data.parentId).toBeNull()
  })
})
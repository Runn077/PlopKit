import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AppError } from '../../errors/appError.js'
import { CommentStatus } from '../../generated/prisma/enums.js'
import { LIMITS } from '../../constants/index.js'
import { createHash } from 'crypto'

vi.mock('../../lib/prisma.js', () => ({
  default: {
    comment: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    commentWidget: { update: vi.fn() },
    user: { findUnique: vi.fn() },
    site: { update: vi.fn() },
  },
}))

vi.mock('../widget.service.js', () => ({
  getWidgetOwnedByUser: vi.fn(),
  trackWidgetLoad: vi.fn(),
  getWidgetByKey: vi.fn(),
}))

import prisma from '../../lib/prisma.js'
import { getWidgetOwnedByUser, trackWidgetLoad, getWidgetByKey } from '../widget.service.js'
import {
  getApprovedComments,
  getPendingComments,
  getDeletedComments,
  createComment,
  approveComment,
  rejectComment,
  restoreComment,
  softDeleteComment,
  permanentDeleteComment,
  permanentDeleteAllDeleted,
  createOwnerReply,
  createOwnerComment,
  pinComment,
  unpinComment,
  updateAutoApprove,
  deleteOwnComment,
} from '../comment.service.js'

function realHash(secret: string): string {
  return createHash('sha256').update(secret).digest('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// --- getApprovedComments ---

describe('getApprovedComments', () => {
  const widgetBase = {
    site: { id: 'site_1', userId: 'user_1', domain: 'example.com', verified: true },
    commentWidget: { id: 'cw_1', pinnedCommentId: null },
  }

  it('throws 404 when the widget or its commentWidget does not exist', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(null)
    await expect(getApprovedComments('wk_123')).rejects.toThrow(AppError)
  })

  it('excludes the pinned comment id from the main list query when one is pinned', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      ...widgetBase,
      commentWidget: { id: 'cw_1', pinnedCommentId: 'pinned_1' },
    } as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'pinned_1', replies: [] } as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    await getApprovedComments('wk_123', undefined, true)

    const findManyArg = vi.mocked(prisma.comment.findMany).mock.calls[0]![0] as any
    expect(findManyArg.where.id).toEqual({ not: 'pinned_1' })
  })

  it('does not filter by id when no comment is pinned', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    await getApprovedComments('wk_123', undefined, true)

    const findManyArg = vi.mocked(prisma.comment.findMany).mock.calls[0]![0] as any
    expect(findManyArg.where.id).toBeUndefined()
  })

  it('calls trackWidgetLoad when there is no cursor and skipQuota is false', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    await getApprovedComments('wk_123')

    expect(trackWidgetLoad).toHaveBeenCalledWith('wk_123')
  })

  it('does not call trackWidgetLoad when a cursor is present', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'cursor_1', createdAt: new Date() } as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    await getApprovedComments('wk_123', 'cursor_1')

    expect(trackWidgetLoad).not.toHaveBeenCalled()
  })

  it('does not call trackWidgetLoad when skipQuota is true, even with no cursor', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    await getApprovedComments('wk_123', undefined, true)

    expect(trackWidgetLoad).not.toHaveBeenCalled()
  })

  it('ignores an unresolvable cursor rather than filtering by it', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    await getApprovedComments('wk_123', 'bad_cursor', true)

    const findManyArg = vi.mocked(prisma.comment.findMany).mock.calls[0]![0] as any
    expect(findManyArg.where.createdAt).toBeUndefined()
  })

  it('sets hasMore true when the returned page equals COMMENT_PAGE_SIZE', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    const fullPage = Array.from({ length: LIMITS.COMMENT_PAGE_SIZE }, (_, i) => ({
      id: `c${i}`,
      isOwnerReply: false,
      authorName: 'Someone',
      replies: [],
    }))
    vi.mocked(prisma.comment.findMany).mockResolvedValue(fullPage as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    const result = await getApprovedComments('wk_123', undefined, true)
    expect(result.hasMore).toBe(true)
  })

  it('sets hasMore false when fewer than COMMENT_PAGE_SIZE comments are returned', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      { id: 'c1', isOwnerReply: false, authorName: 'Someone', replies: [] },
    ] as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    const result = await getApprovedComments('wk_123', undefined, true)
    expect(result.hasMore).toBe(false)
  })

  it('sums topLevelTotal and replyTotal into total', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValueOnce(7).mockResolvedValueOnce(3)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([])
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    const result = await getApprovedComments('wk_123', undefined, true)
    expect(result.total).toBe(10)
  })

  it('replaces an owner reply authorName with the site owner name, for both top-level and nested replies', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      {
        id: 'c1',
        isOwnerReply: true,
        authorName: 'ignored_stored_name',
        replies: [
          { id: 'r1', isOwnerReply: true, authorName: 'ignored_reply_name' },
          { id: 'r2', isOwnerReply: false, authorName: 'Jane' },
        ],
      },
    ] as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)

    const result = await getApprovedComments('wk_123', undefined, true)
    expect(result.comments[0].authorName).toBe('Ru')
    expect(result.comments[0].replies[0].authorName).toBe('Ru')
    expect(result.comments[0].replies[1].authorName).toBe('Jane')
  })

  it('falls back to "Site owner" when the site owner has no name set', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      { id: 'c1', isOwnerReply: true, authorName: 'x', replies: [] },
    ] as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: null } as any)

    const result = await getApprovedComments('wk_123', undefined, true)
    expect(result.comments[0].authorName).toBe('Site owner')
  })
})

// --- getPendingComments ---

describe('getPendingComments', () => {
  const widgetBase = {
    site: { userId: 'user_1' },
    commentWidget: { id: 'cw_1' },
  }

  it('throws 404 when the widget does not exist or is not owned by the user', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(null)
    await expect(getPendingComments('wk_123', 'user_1')).rejects.toThrow(AppError)
  })

  it('throws 404 when the widget belongs to a different user', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ ...widgetBase, site: { userId: 'other' } } as any)
    await expect(getPendingComments('wk_123', 'user_1')).rejects.toThrow('Widget not found')
  })

  it('returns orphaned replies whose parent is no longer pending', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findMany)
      .mockResolvedValueOnce([]) // main comments
      .mockResolvedValueOnce([{ id: 'orphan_1' }] as any) // orphaned replies

    const result = await getPendingComments('wk_123', 'user_1')
    expect(result.orphanedReplies).toEqual([{ id: 'orphan_1' }])
  })

  it('sets hasMore true and trims to PENDING_PAGE_SIZE when more than one extra is fetched', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    const overPage = Array.from({ length: LIMITS.PENDING_PAGE_SIZE + 1 }, (_, i) => ({ id: `c${i}` }))
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce(overPage as any).mockResolvedValueOnce([])

    const result = await getPendingComments('wk_123', 'user_1')
    expect(result.hasMore).toBe(true)
    expect(result.comments).toHaveLength(LIMITS.PENDING_PAGE_SIZE)
  })

  it('sets nextCursor to the id of the last comment on the trimmed page', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    const overPage = Array.from({ length: LIMITS.PENDING_PAGE_SIZE + 1 }, (_, i) => ({ id: `c${i}` }))
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce(overPage as any).mockResolvedValueOnce([])

    const result = await getPendingComments('wk_123', 'user_1')
    expect(result.nextCursor).toBe(overPage[LIMITS.PENDING_PAGE_SIZE - 1]!.id)
  })

  it('sets nextCursor to null when there is no more data', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce([{ id: 'c1' }] as any).mockResolvedValueOnce([])

    const result = await getPendingComments('wk_123', 'user_1')
    expect(result.nextCursor).toBeNull()
  })

  it('ignores an unresolvable cursor', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce([]).mockResolvedValueOnce([])

    await getPendingComments('wk_123', 'user_1', 'bad_cursor')

    const findManyArg = vi.mocked(prisma.comment.findMany).mock.calls[0]![0] as any
    expect(findManyArg.where.createdAt).toBeUndefined()
  })
})

// --- getDeletedComments ---

describe('getDeletedComments', () => {
  const widgetBase = {
    site: { userId: 'user_1' },
    commentWidget: { id: 'cw_1' },
  }

  it('throws 404 when the widget does not exist or is not owned by the user', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(null)
    await expect(getDeletedComments('wk_123', 'user_1')).rejects.toThrow(AppError)
  })

  it('returns orphaned replies whose parent is not deleted', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'orphan_1' }] as any)

    const result = await getDeletedComments('wk_123', 'user_1')
    expect(result.orphanedReplies).toEqual([{ id: 'orphan_1' }])
  })

  it('sets hasMore true and trims to DELETED_PAGE_SIZE when more than one extra is fetched', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    const overPage = Array.from({ length: LIMITS.DELETED_PAGE_SIZE + 1 }, (_, i) => ({ id: `c${i}` }))
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce(overPage as any).mockResolvedValueOnce([])

    const result = await getDeletedComments('wk_123', 'user_1')
    expect(result.hasMore).toBe(true)
    expect(result.comments).toHaveLength(LIMITS.DELETED_PAGE_SIZE)
  })

  it('only applies the cursor filter when the cursor comment itself has a deletedAt value', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', deletedAt: null } as any)
    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce([]).mockResolvedValueOnce([])

    await getDeletedComments('wk_123', 'user_1', 'c1')

    const findManyArg = vi.mocked(prisma.comment.findMany).mock.calls[0]![0] as any
    expect(findManyArg.where.deletedAt).toEqual({ not: null })
  })
})

// --- createComment ---

describe('createComment', () => {
  const widgetBase = {
    site: {
      id: 'site_1',
      domain: 'example.com',
      verified: true,
      userId: 'user_1',
      bannedWords: [] as string[],
      autoDeleteBannedWords: false,
    },
    commentWidget: {
      id: 'cw_1',
      autoApprove: false,
    },
  }

  it('throws 400 when the sanitized body is empty', async () => {
    await expect(
      createComment('wk_123', '/post', '   ', undefined, undefined, 'https://example.com')
    ).rejects.toThrow('Comment body is required')
  })

  it('strips HTML tags from the body via sanitize-html', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment(
      'wk_123', '/post', '<script>alert(1)</script>Hello', undefined, undefined, 'https://example.com'
    )

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.body).toBe('Hello')
  })

  it('throws 400 when the body exceeds COMMENT_MAX_LENGTH', async () => {
    const tooLong = 'a'.repeat(LIMITS.COMMENT_MAX_LENGTH + 1)
    await expect(
      createComment('wk_123', '/post', tooLong, undefined, undefined, 'https://example.com')
    ).rejects.toThrow(`Comment must be under ${LIMITS.COMMENT_MAX_LENGTH} characters`)
  })

  it('defaults authorName to Anonymous when not provided', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.authorName).toBe('Anonymous')
  })

  it('defaults authorName to Anonymous when the sanitized name is blank', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com', '   ')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.authorName).toBe('Anonymous')
  })

  it('throws 404 when the widget key does not resolve', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(null)
    await expect(
      createComment('wk_bad', '/post', 'Hello', undefined, undefined, 'https://example.com')
    ).rejects.toThrow('Invalid widget key')
  })

  it('allows a localhost origin regardless of the site domain', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await expect(
      createComment('wk_123', '/post', 'Hello', undefined, undefined, 'http://localhost:5173')
    ).resolves.toBeDefined()
  })

  it('throws 403 when the origin hostname does not match the site domain', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    await expect(
      createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://evil.com')
    ).rejects.toThrow('Domain not allowed')
  })

  it('throws 403 when the origin is not a valid URL', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    await expect(
      createComment('wk_123', '/post', 'Hello', undefined, undefined, 'not-a-url')
    ).rejects.toThrow('Domain not allowed')
  })

  it('marks an unverified site as verified after a matching non-localhost origin comment', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      ...widgetBase,
      site: { ...widgetBase.site, verified: false },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com')

    expect(prisma.site.update).toHaveBeenCalledWith({
      where: { id: 'site_1' },
      data: { verified: true },
    })
  })

  it('does not re-verify an already-verified site', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com')

    expect(prisma.site.update).not.toHaveBeenCalled()
  })

  it('does not verify the site when the origin is localhost, even if unverified', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      ...widgetBase,
      site: { ...widgetBase.site, verified: false },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'http://localhost:5173')

    expect(prisma.site.update).not.toHaveBeenCalled()
  })

  it('rejects a comment containing a banned word when autoDeleteBannedWords is true', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      ...widgetBase,
      site: { ...widgetBase.site, bannedWords: ['spam'], autoDeleteBannedWords: true },
    } as any)

    await expect(
      createComment('wk_123', '/post', 'This is spam content', undefined, undefined, 'https://example.com')
    ).rejects.toThrow('Your comment contains prohibited words.')
  })

  it('masks a banned word with asterisks when autoDeleteBannedWords is false', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      ...widgetBase,
      site: { ...widgetBase.site, bannedWords: ['spam'], autoDeleteBannedWords: false },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'This is spam content', undefined, undefined, 'https://example.com')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.body).toBe('This is **** content')
  })

  it('sets status to approved when autoApprove is true', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      ...widgetBase,
      commentWidget: { ...widgetBase.commentWidget, autoApprove: true },
    } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.status).toBe(CommentStatus.approved)
  })

  it('sets status to pending when autoApprove is false', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.status).toBe(CommentStatus.pending)
  })

  it('throws 404 when parentId references a non-existent comment', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)

    await expect(
      createComment('wk_123', '/post', 'Hello', 'missing_parent', undefined, 'https://example.com')
    ).rejects.toThrow('Parent comment not found')
  })

  it('throws 403 when parentId belongs to a different commentWidget', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'parent_1', commentWidgetId: 'other_cw', parentId: null, deletedAt: null,
    } as any)

    await expect(
      createComment('wk_123', '/post', 'Hello', 'parent_1', undefined, 'https://example.com')
    ).rejects.toThrow('Parent comment does not belong to this widget')
  })

  it('throws 400 when attempting to reply to a reply', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'parent_1', commentWidgetId: 'cw_1', parentId: 'grandparent_1', deletedAt: null,
    } as any)

    await expect(
      createComment('wk_123', '/post', 'Hello', 'parent_1', undefined, 'https://example.com')
    ).rejects.toThrow('Cannot reply to a reply')
  })

  it('throws 400 when replying to a deleted comment', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'parent_1', commentWidgetId: 'cw_1', parentId: null, deletedAt: new Date(),
    } as any)

    await expect(
      createComment('wk_123', '/post', 'Hello', 'parent_1', undefined, 'https://example.com')
    ).rejects.toThrow('Cannot reply to a deleted comment')
  })

  it('throws 404 when quotedId references a non-existent comment', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)

    await expect(
      createComment('wk_123', '/post', 'Hello', undefined, 'missing_quote', 'https://example.com')
    ).rejects.toThrow('Quoted comment not found')
  })

  it('throws 403 when quotedId belongs to a different commentWidget', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'quoted_1', commentWidgetId: 'other_cw', parentId: 'some_parent',
    } as any)

    await expect(
      createComment('wk_123', '/post', 'Hello', undefined, 'quoted_1', 'https://example.com')
    ).rejects.toThrow('Quoted comment does not belong to this widget')
  })

  it('throws 400 when quotedId points to a top-level comment rather than a reply', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'quoted_1', commentWidgetId: 'cw_1', parentId: null,
    } as any)

    await expect(
      createComment('wk_123', '/post', 'Hello', undefined, 'quoted_1', 'https://example.com')
    ).rejects.toThrow('Can only quote a reply')
  })

  it('hashes the commenterSecret into commenterDisplayId using the same algorithm as hashSecret', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    const secret = '123e4567-e89b-12d3-a456-426614174000'
    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com', undefined, secret)

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.commenterDisplayId).toBe(realHash(secret))
  })

  it('leaves commenterDisplayId null when no commenterSecret is given', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(widgetBase as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createComment('wk_123', '/post', 'Hello', undefined, undefined, 'https://example.com')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.commenterDisplayId).toBeNull()
  })
})

// --- moderation actions: approve / reject / restore / softDelete / permanentDelete ---

describe('approveComment', () => {
  it('throws 404 when the comment does not exist', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)
    await expect(approveComment('c1', 'user_1')).rejects.toThrow(AppError)
  })

  it('throws 403 when the widget is not owned by the user', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'other' } } as any)
    await expect(approveComment('c1', 'user_1')).rejects.toThrow('Forbidden')
  })

  it('cascades approval to replies when approving a top-level comment', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await approveComment('c1', 'user_1')

    expect(prisma.comment.updateMany).toHaveBeenCalledWith({
      where: { parentId: 'c1', deletedAt: null },
      data: { status: CommentStatus.approved },
    })
  })

  it('does not cascade when approving a reply', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: 'parent_x' } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await approveComment('c1', 'user_1')

    expect(prisma.comment.updateMany).not.toHaveBeenCalled()
  })
})

describe('rejectComment', () => {
  it('soft-deletes a top-level comment and cascades to all its replies', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await rejectComment('c1', 'user_1')

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { deletedAt: expect.any(Date) },
    })
    expect(prisma.comment.updateMany).toHaveBeenCalledWith({
      where: { parentId: 'c1' },
      data: { deletedAt: expect.any(Date) },
    })
  })

  it('does not cascade when rejecting a reply', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: 'parent_x' } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await rejectComment('c1', 'user_1')

    expect(prisma.comment.updateMany).not.toHaveBeenCalled()
  })
})

describe('restoreComment', () => {
  it('restores a top-level comment and only un-deletes replies that were cascade-deleted (deletedByParent)', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await restoreComment('c1', 'user_1')

    expect(prisma.comment.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { deletedAt: null, status: CommentStatus.approved },
    })
    expect(prisma.comment.updateMany).toHaveBeenCalledWith({
      where: { parentId: 'c1', deletedByParent: true },
      data: { deletedAt: null, deletedByParent: false, status: CommentStatus.approved },
    })
  })

  it('does not cascade when restoring a reply', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: 'parent_x' } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await restoreComment('c1', 'user_1')

    expect(prisma.comment.updateMany).not.toHaveBeenCalled()
  })
})

describe('softDeleteComment', () => {
  it('soft-deletes a top-level comment and marks only its currently-live replies as deletedByParent', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await softDeleteComment('c1', 'user_1')

    expect(prisma.comment.updateMany).toHaveBeenCalledWith({
      where: { parentId: 'c1', deletedAt: null },
      data: { deletedAt: expect.any(Date), deletedByParent: true },
    })
  })

  it('does not cascade when soft-deleting a reply', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: 'parent_x' } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.update).mockResolvedValue({} as any)

    await softDeleteComment('c1', 'user_1')

    expect(prisma.comment.updateMany).not.toHaveBeenCalled()
  })
})

describe('permanentDeleteComment', () => {
  it('deletes all replies before deleting the comment itself, after verifying ownership', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.deleteMany).mockResolvedValue({} as any)
    vi.mocked(prisma.comment.delete).mockResolvedValue({} as any)

    await permanentDeleteComment('c1', 'user_1')

    expect(prisma.comment.deleteMany).toHaveBeenCalledWith({ where: { parentId: 'c1' } })
    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
  })

  it('throws 403 without deleting anything when the widget is not owned by the user', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', widgetKey: 'wk_1', parentId: null } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'other' } } as any)

    await expect(permanentDeleteComment('c1', 'user_1')).rejects.toThrow('Forbidden')
    expect(prisma.comment.deleteMany).not.toHaveBeenCalled()
    expect(prisma.comment.delete).not.toHaveBeenCalled()
  })
})

describe('permanentDeleteAllDeleted', () => {
  it('throws 404 when the widget is not owned by the user', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'other' } } as any)
    await expect(permanentDeleteAllDeleted('wk_123', 'user_1')).rejects.toThrow('Widget not found')
  })

  it('deletes all soft-deleted comments scoped to this commentWidget', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.comment.deleteMany).mockResolvedValue({} as any)

    await permanentDeleteAllDeleted('wk_123', 'user_1')

    expect(prisma.comment.deleteMany).toHaveBeenCalledWith({
      where: { commentWidgetId: 'cw_1', deletedAt: { not: null } },
    })
  })
})

// --- createOwnerReply ---

describe('createOwnerReply', () => {
  it('throws 400 when the sanitized body is empty', async () => {
    await expect(createOwnerReply('c1', '   ', 'user_1')).rejects.toThrow('Reply body is required')
  })

  it('throws 404 when the parent comment does not exist', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)
    await expect(createOwnerReply('c1', 'Reply text', 'user_1')).rejects.toThrow('Comment not found')
  })

  it('throws 400 when the parent comment is deleted', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', deletedAt: new Date(), parentId: null } as any)
    await expect(createOwnerReply('c1', 'Reply text', 'user_1')).rejects.toThrow('Cannot reply to a deleted comment')
  })

  it('replying to a top-level comment: uses that comment as the thread root and sets quotedId null', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1', deletedAt: null, parentId: null, widgetKey: 'wk_1',
      commentWidgetId: 'cw_1', pageUrl: '/post',
    } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createOwnerReply('c1', 'Reply text', 'user_1')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.parentId).toBe('c1')
    expect(createArg.data.quotedId).toBeNull()
  })

  it('replying to a reply: resolves the top-level parent and quotes the reply itself', async () => {
    vi.mocked(prisma.comment.findUnique)
      .mockResolvedValueOnce({ id: 'reply_1', deletedAt: null, parentId: 'top_1' } as any) // the target comment
      .mockResolvedValueOnce({
        id: 'top_1', widgetKey: 'wk_1', commentWidgetId: 'cw_1', pageUrl: '/post',
      } as any) // resolved top-level parent
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createOwnerReply('reply_1', 'Reply text', 'user_1')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.parentId).toBe('top_1')
    expect(createArg.data.quotedId).toBe('reply_1')
  })

  it('throws 403 when the resolved widget is not owned by the user', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1', deletedAt: null, parentId: null, widgetKey: 'wk_1',
      commentWidgetId: 'cw_1', pageUrl: '/post',
    } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'other' } } as any)

    await expect(createOwnerReply('c1', 'Reply text', 'user_1')).rejects.toThrow('Forbidden')
  })

  it('falls back to "Site owner" when the replying user has no name', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1', deletedAt: null, parentId: null, widgetKey: 'wk_1',
      commentWidgetId: 'cw_1', pageUrl: '/post',
    } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: null } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createOwnerReply('c1', 'Reply text', 'user_1')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.authorName).toBe('Site owner')
  })

  it('always sets status to approved for owner replies', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1', deletedAt: null, parentId: null, widgetKey: 'wk_1',
      commentWidgetId: 'cw_1', pageUrl: '/post',
    } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createOwnerReply('c1', 'Reply text', 'user_1')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.status).toBe(CommentStatus.approved)
    expect(createArg.data.isOwnerReply).toBe(true)
  })
})

// --- createOwnerComment ---

describe('createOwnerComment', () => {
  it('throws 400 when the sanitized body is empty', async () => {
    await expect(createOwnerComment('wk_123', '/post', '   ', 'user_1')).rejects.toThrow('Body is required')
  })

  it('throws 404 when the widget or its commentWidget does not exist', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue(null)
    await expect(createOwnerComment('wk_123', '/post', 'Hello', 'user_1')).rejects.toThrow('Widget not found')
  })

  it('throws 403 when the widget is not owned by the user', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'other' } } as any)
    await expect(createOwnerComment('wk_123', '/post', 'Hello', 'user_1')).rejects.toThrow('Forbidden')
  })

  it('creates an approved, isOwnerReply comment with the owner name', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Ru' } as any)
    vi.mocked(prisma.comment.create).mockResolvedValue({} as any)

    await createOwnerComment('wk_123', '/post', 'Hello', 'user_1')

    const createArg = vi.mocked(prisma.comment.create).mock.calls[0]![0] as any
    expect(createArg.data.status).toBe(CommentStatus.approved)
    expect(createArg.data.isOwnerReply).toBe(true)
    expect(createArg.data.authorName).toBe('Ru')
  })
})

// --- pin / unpin ---

describe('pinComment', () => {
  it('throws 404 when the comment does not exist', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)
    await expect(pinComment('c1', 'user_1')).rejects.toThrow('Comment not found')
  })

  it('throws 400 when attempting to pin a reply', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', parentId: 'parent_x', widgetKey: 'wk_1' } as any)
    await expect(pinComment('c1', 'user_1')).rejects.toThrow('Cannot pin a reply')
  })

  it('throws 403 when the widget is not owned by the user', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', parentId: null, widgetKey: 'wk_1' } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'other' } } as any)
    await expect(pinComment('c1', 'user_1')).rejects.toThrow('Forbidden')
  })

  it('sets pinnedCommentId to the given comment', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', parentId: null, widgetKey: 'wk_1' } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.commentWidget.update).mockResolvedValue({} as any)

    await pinComment('c1', 'user_1')

    expect(prisma.commentWidget.update).toHaveBeenCalledWith({
      where: { id: 'cw_1' },
      data: { pinnedCommentId: 'c1' },
    })
  })
})

describe('unpinComment', () => {
  it('throws 403 when the widget is not owned by the user', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'other' } } as any)
    await expect(unpinComment('wk_123', 'user_1')).rejects.toThrow('Forbidden')
  })

  it('clears pinnedCommentId', async () => {
    vi.mocked(getWidgetByKey).mockResolvedValue({ commentWidget: { id: 'cw_1' }, site: { userId: 'user_1' } } as any)
    vi.mocked(prisma.commentWidget.update).mockResolvedValue({} as any)

    await unpinComment('wk_123', 'user_1')

    expect(prisma.commentWidget.update).toHaveBeenCalledWith({
      where: { id: 'cw_1' },
      data: { pinnedCommentId: null },
    })
  })
})

// --- updateAutoApprove ---

describe('updateAutoApprove', () => {
  it('throws 404 when the widget has no commentWidget', async () => {
    vi.mocked(getWidgetOwnedByUser).mockResolvedValue({ commentWidget: null } as any)
    await expect(updateAutoApprove('widget_1', 'user_1', true)).rejects.toThrow('Widget not found')
  })

  it('updates autoApprove to the given value', async () => {
    vi.mocked(getWidgetOwnedByUser).mockResolvedValue({ commentWidget: { id: 'cw_1' } } as any)
    vi.mocked(prisma.commentWidget.update).mockResolvedValue({} as any)

    await updateAutoApprove('widget_1', 'user_1', true)

    expect(prisma.commentWidget.update).toHaveBeenCalledWith({
      where: { id: 'cw_1' },
      data: { autoApprove: true },
    })
  })
})

// --- deleteOwnComment ---

describe('deleteOwnComment', () => {
  it('throws 404 when the comment does not exist', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)
    await expect(deleteOwnComment('c1', 'secret')).rejects.toThrow('Comment not found')
  })

  it('throws 403 when the comment has no commenterDisplayId (not self-deletable)', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', commenterDisplayId: null } as any)
    await expect(deleteOwnComment('c1', 'secret')).rejects.toThrow('This comment cannot be deleted by its author')
  })

  it('throws 403 when the provided secret does not hash to the stored commenterDisplayId', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({ id: 'c1', commenterDisplayId: 'stored_hash' } as any)
    await expect(deleteOwnComment('c1', 'wrong_secret')).rejects.toThrow('Invalid commenter secret')
  })

  it('deletes the comment when the secret hashes to the correct value', async () => {
    const secret = '123e4567-e89b-12d3-a456-426614174000'
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1', commenterDisplayId: realHash(secret),
    } as any)
    vi.mocked(prisma.comment.delete).mockResolvedValue({} as any)

    await deleteOwnComment('c1', secret)

    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
  })
})

describe('deleteOwnComment', () => {
  it('throws 404 when comment does not exist', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue(null)

    await expect(deleteOwnComment('c1', 'secret')).rejects.toThrow(AppError)
    await expect(deleteOwnComment('c1', 'secret')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 403 when comment has no commenterDisplayId', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1',
      commenterDisplayId: null,
    } as any)

    await expect(deleteOwnComment('c1', 'secret')).rejects.toMatchObject({ statusCode: 403 })
  })

  it('throws 403 when secret does not match', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1',
      commenterDisplayId: realHash('correct-secret'),
    } as any)

    await expect(deleteOwnComment('c1', 'wrong-secret')).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.comment.updateMany).not.toHaveBeenCalled()
    expect(prisma.comment.delete).not.toHaveBeenCalled()
  })

  it('marks quoting replies with quotedWasDeleted before deleting the comment', async () => {
    const secret = 'correct-secret'
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1',
      commenterDisplayId: realHash(secret),
    } as any)
    vi.mocked(prisma.comment.updateMany).mockResolvedValue({ count: 2 } as any)
    vi.mocked(prisma.comment.delete).mockResolvedValue({} as any)

    await deleteOwnComment('c1', secret)

    expect(prisma.comment.updateMany).toHaveBeenCalledWith({
      where: { quotedId: 'c1' },
      data: { quotedWasDeleted: true },
    })
    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })

    const updateManyOrder = vi.mocked(prisma.comment.updateMany).mock.invocationCallOrder[0]!
    const deleteOrder = vi.mocked(prisma.comment.delete).mock.invocationCallOrder[0]!
    expect(updateManyOrder).toBeLessThan(deleteOrder)
  })
})

describe('permanentDeleteComment', () => {
  it('marks quoting replies, deletes child replies, then deletes the comment, in order', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1',
      widgetKey: 'wk1',
      parentId: null,
    } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({
      site: { userId: 'user1' },
    } as any)
    vi.mocked(prisma.comment.updateMany).mockResolvedValue({ count: 1 } as any)
    vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 3 } as any)
    vi.mocked(prisma.comment.delete).mockResolvedValue({} as any)

    await permanentDeleteComment('c1', 'user1')

    expect(prisma.comment.updateMany).toHaveBeenCalledWith({
      where: { quotedId: 'c1' },
      data: { quotedWasDeleted: true },
    })
    expect(prisma.comment.deleteMany).toHaveBeenCalledWith({ where: { parentId: 'c1' } })
    expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })

    const orders = [
      vi.mocked(prisma.comment.updateMany).mock.invocationCallOrder[0]!,
      vi.mocked(prisma.comment.deleteMany).mock.invocationCallOrder[0]!,
      vi.mocked(prisma.comment.delete).mock.invocationCallOrder[0]!,
    ]
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('throws 403 when the requesting user does not own the widget', async () => {
    vi.mocked(prisma.comment.findUnique).mockResolvedValue({
      id: 'c1',
      widgetKey: 'wk1',
      parentId: null,
    } as any)
    vi.mocked(getWidgetByKey).mockResolvedValue({
      site: { userId: 'someone-else' },
    } as any)

    await expect(permanentDeleteComment('c1', 'user1')).rejects.toMatchObject({ statusCode: 403 })
    expect(prisma.comment.updateMany).not.toHaveBeenCalled()
    expect(prisma.comment.delete).not.toHaveBeenCalled()
  })
})

describe('getApprovedComments - quoted fallback logic', () => {
  function baseWidgetMock() {
    vi.mocked(getWidgetByKey).mockResolvedValue({
      site: { userId: 'owner1' },
      commentWidget: { id: 'cw1', pinnedCommentId: null },
    } as any)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ name: 'Owner Name' } as any)
    vi.mocked(prisma.comment.count).mockResolvedValue(0)
  }

  it('passes through the real quoted object when the quoted reply still exists', async () => {
    baseWidgetMock()
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      {
        id: 'top1',
        isOwnerReply: false,
        authorName: 'Alice',
        replies: [
          {
            id: 'r1',
            isOwnerReply: false,
            authorName: 'Bob',
            quotedId: 'r0',
            quotedWasDeleted: false,
            quoted: { id: 'r0', body: 'original text', deletedAt: null, status: 'approved', commenterDisplayId: 'abc123', isOwnerReply: false },
          },
        ],
      },
    ] as any)

    const result = await getApprovedComments('widget-key-1')

    expect(result.comments[0].replies[0].quoted).toEqual({
      id: 'r0', body: 'original text', deletedAt: null, status: 'approved', commenterDisplayId: 'abc123', isOwnerReply: false,
    })
  })

  it('returns a synthesized deleted placeholder when quotedWasDeleted is true and quoted is null', async () => {
    baseWidgetMock()
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      {
        id: 'top1',
        isOwnerReply: false,
        authorName: 'Alice',
        replies: [
          {
            id: 'r1',
            isOwnerReply: false,
            authorName: 'Bob',
            quotedId: null,
            quotedWasDeleted: true,
            quoted: null,
          },
        ],
      },
    ] as any)

    const result = await getApprovedComments('widget-key-1')
    const quoted = result.comments[0].replies[0].quoted

    expect(quoted).toBeTruthy()
    expect(quoted.body).toBe('')
    expect(quoted.deletedAt).not.toBeNull()
    expect(quoted.commenterDisplayId).toBeNull()
  })

  it('returns null quoted when the reply never quoted anything', async () => {
    baseWidgetMock()
    vi.mocked(prisma.comment.findMany).mockResolvedValue([
      {
        id: 'top1',
        isOwnerReply: false,
        authorName: 'Alice',
        replies: [
          {
            id: 'r1',
            isOwnerReply: false,
            authorName: 'Bob',
            quotedId: null,
            quotedWasDeleted: false,
            quoted: null,
          },
        ],
      },
    ] as any)

    const result = await getApprovedComments('widget-key-1')

    expect(result.comments[0].replies[0].quoted).toBeNull()
  })
})
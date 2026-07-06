import { describe, it, expect } from 'vitest'
import {
  getCommentsSchema,
  getWidgetCommentsSchema,
  createCommentSchema,
  deleteOwnCommentSchema,
  ownerPostSchema,
  updateBannedWordsSchema,
} from '../comment.validators.js'
import { LIMITS } from '../../constants/index.js'

const validUuid = '123e4567-e89b-12d3-a456-426614174000'

describe('getCommentsSchema', () => {
  it('accepts widget_key alone', () => {
    expect(getCommentsSchema.safeParse({ widget_key: 'wk_123' }).success).toBe(true)
  })

  it('accepts optional page_url and cursor', () => {
    const result = getCommentsSchema.safeParse({
      widget_key: 'wk_123',
      page_url: '/blog/post-1',
      cursor: 'abc',
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing widget_key', () => {
    expect(getCommentsSchema.safeParse({}).success).toBe(false)
  })

  it('rejects an empty widget_key', () => {
    expect(getCommentsSchema.safeParse({ widget_key: '' }).success).toBe(false)
  })
})

describe('getWidgetCommentsSchema', () => {
  it('accepts widget_key alone', () => {
    expect(getWidgetCommentsSchema.safeParse({ widget_key: 'wk_123' }).success).toBe(true)
  })

  it('rejects a missing widget_key', () => {
    expect(getWidgetCommentsSchema.safeParse({}).success).toBe(false)
  })
})

describe('createCommentSchema', () => {
  const base = {
    widget_key: 'wk_123',
    page_url: '/blog/post-1',
    body: 'Great post!',
  }

  it('accepts a minimal valid comment', () => {
    expect(createCommentSchema.safeParse(base).success).toBe(true)
  })

  it('accepts optional parent_id, quoted_id, author_name, commenter_secret', () => {
    const result = createCommentSchema.safeParse({
      ...base,
      parent_id: 'comment_1',
      quoted_id: 'comment_2',
      author_name: 'Ru',
      commenter_secret: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing widget_key', () => {
    const { widget_key, ...rest } = base
    expect(createCommentSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a missing page_url', () => {
    const { page_url, ...rest } = base
    expect(createCommentSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects an empty body', () => {
    expect(createCommentSchema.safeParse({ ...base, body: '' }).success).toBe(false)
  })

  it('rejects a body exceeding COMMENT_MAX_LENGTH', () => {
    const tooLong = 'a'.repeat(LIMITS.COMMENT_MAX_LENGTH + 1)
    expect(createCommentSchema.safeParse({ ...base, body: tooLong }).success).toBe(false)
  })

  it('accepts a body exactly at COMMENT_MAX_LENGTH', () => {
    const exact = 'a'.repeat(LIMITS.COMMENT_MAX_LENGTH)
    expect(createCommentSchema.safeParse({ ...base, body: exact }).success).toBe(true)
  })

  it('rejects an author_name over 30 characters', () => {
    const longName = 'a'.repeat(31)
    expect(createCommentSchema.safeParse({ ...base, author_name: longName }).success).toBe(false)
  })

  it('accepts an author_name at exactly 30 characters', () => {
    const name = 'a'.repeat(30)
    expect(createCommentSchema.safeParse({ ...base, author_name: name }).success).toBe(true)
  })

  it('rejects a commenter_secret that is not a valid UUID', () => {
    expect(
      createCommentSchema.safeParse({ ...base, commenter_secret: 'not-a-uuid' }).success
    ).toBe(false)
  })
})

describe('deleteOwnCommentSchema', () => {
  it('accepts a valid comment_id and commenter_secret', () => {
    const result = deleteOwnCommentSchema.safeParse({
      comment_id: 'comment_1',
      commenter_secret: validUuid,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a missing comment_id', () => {
    expect(
      deleteOwnCommentSchema.safeParse({ commenter_secret: validUuid }).success
    ).toBe(false)
  })

  it('rejects a missing commenter_secret', () => {
    expect(
      deleteOwnCommentSchema.safeParse({ comment_id: 'comment_1' }).success
    ).toBe(false)
  })

  it('rejects an invalid commenter_secret format', () => {
    const result = deleteOwnCommentSchema.safeParse({
      comment_id: 'comment_1',
      commenter_secret: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })
})

describe('ownerPostSchema', () => {
  const base = {
    body: 'Owner reply',
    page_url: '/blog/post-1',
    widget_key: 'wk_123',
  }

  it('accepts a valid owner post', () => {
    expect(ownerPostSchema.safeParse(base).success).toBe(true)
  })

  it('rejects an empty body', () => {
    expect(ownerPostSchema.safeParse({ ...base, body: '' }).success).toBe(false)
  })

  it('rejects a body exceeding COMMENT_MAX_LENGTH', () => {
    const tooLong = 'a'.repeat(LIMITS.COMMENT_MAX_LENGTH + 1)
    expect(ownerPostSchema.safeParse({ ...base, body: tooLong }).success).toBe(false)
  })

  it('rejects a missing page_url', () => {
    const { page_url, ...rest } = base
    expect(ownerPostSchema.safeParse(rest).success).toBe(false)
  })

  it('rejects a missing widget_key', () => {
    const { widget_key, ...rest } = base
    expect(ownerPostSchema.safeParse(rest).success).toBe(false)
  })
})

describe('updateBannedWordsSchema', () => {
  it('accepts an empty object since all fields are optional', () => {
    expect(updateBannedWordsSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a list of banned words', () => {
    const result = updateBannedWordsSchema.safeParse({
      bannedWords: ['spam', 'scam'],
    })
    expect(result.success).toBe(true)
  })

  it('accepts autoDeleteBannedWords alone', () => {
    const result = updateBannedWordsSchema.safeParse({
      autoDeleteBannedWords: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects a non-array bannedWords', () => {
    expect(updateBannedWordsSchema.safeParse({ bannedWords: 'spam' }).success).toBe(false)
  })

  it('rejects a non-string entry in bannedWords array', () => {
    expect(updateBannedWordsSchema.safeParse({ bannedWords: [123] }).success).toBe(false)
  })
})
import { describe, it, expect } from 'vitest'
import { importSiteSchema } from '../import.validators.js'
import { CommentStatus, WidgetType } from '../../generated/prisma/enums.js'

const validStatus = Object.values(CommentStatus)[0]
const validWidgetType = Object.values(WidgetType)[0]

const validWidget = {
  id: 'widget_1',
  name: 'Main Widget',
  widgetKey: 'wk_123',
  type: validWidgetType,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const validComment = {
  id: 'comment_1',
  widgetKey: 'wk_123',
  parentId: null,
  quotedId: null,
  pageUrl: '/blog/post-1',
  body: 'Great post!',
  status: validStatus,
  isOwnerReply: false,
  authorName: 'Ru',
  commenterDisplayId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const validExportData = {
  schemaVersion: 1,
  site: { name: 'My Blog', domain: 'example.com' },
  widgets: [validWidget],
  comments: [validComment],
}

const basePayload = {
  name: 'Imported Blog',
  domain: 'example.com',
  data: validExportData,
}

describe('importSiteSchema — top-level fields', () => {
  it('accepts a fully valid import payload', () => {
    expect(importSiteSchema.safeParse(basePayload).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(importSiteSchema.safeParse({ ...basePayload, name: '' }).success).toBe(false)
  })

  it('rejects a name over 200 characters', () => {
    const longName = 'a'.repeat(201)
    expect(importSiteSchema.safeParse({ ...basePayload, name: longName }).success).toBe(false)
  })

  it('rejects an invalid domain', () => {
    expect(importSiteSchema.safeParse({ ...basePayload, domain: 'not a domain' }).success).toBe(false)
  })
})

describe('importSiteSchema — data shape guard', () => {
  it('rejects data that is null', () => {
    expect(importSiteSchema.safeParse({ ...basePayload, data: null }).success).toBe(false)
  })

  it('rejects data that is an array', () => {
    expect(importSiteSchema.safeParse({ ...basePayload, data: [] }).success).toBe(false)
  })

  it('rejects data that is a string', () => {
    expect(importSiteSchema.safeParse({ ...basePayload, data: 'not an object' }).success).toBe(false)
  })

  it('surfaces the friendly "not a valid export file" message for a non-object', () => {
    const result = importSiteSchema.safeParse({ ...basePayload, data: 'garbage' })
    if (!result.success) {
      expect(result.error.issues[0]!.message).toBe(
        "This doesn't look like a valid PlopKit export file"
      )
    }
  })
})

describe('importSiteSchema — export data validation', () => {
  it('rejects a missing schemaVersion', () => {
    const { schemaVersion, ...rest } = validExportData
    expect(importSiteSchema.safeParse({ ...basePayload, data: rest }).success).toBe(false)
  })

  it('rejects a schemaVersion other than 1', () => {
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, schemaVersion: 2 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing site block', () => {
    const { site, ...rest } = validExportData
    expect(importSiteSchema.safeParse({ ...basePayload, data: rest }).success).toBe(false)
  })

  it('rejects more than 1000 widgets', () => {
    const tooMany = Array.from({ length: 1001 }, (_, i) => ({ ...validWidget, id: `w${i}` }))
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, widgets: tooMany },
    })
    expect(result.success).toBe(false)
  })

  it('accepts exactly 1000 widgets', () => {
    const max = Array.from({ length: 1000 }, (_, i) => ({ ...validWidget, id: `w${i}` }))
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, widgets: max },
    })
    expect(result.success).toBe(true)
  })

  it('rejects more than 20,000 comments', () => {
    const tooMany = Array.from({ length: 20_001 }, (_, i) => ({ ...validComment, id: `c${i}` }))
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, comments: tooMany },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a comment with an invalid status', () => {
    const badComment = { ...validComment, status: 'not_a_real_status' }
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, comments: [badComment] },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a comment body over 10,000 characters', () => {
    const badComment = { ...validComment, body: 'a'.repeat(10_001) }
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, comments: [badComment] },
    })
    expect(result.success).toBe(false)
  })

  it('accepts a comment with null parentId, quotedId, and commenterDisplayId', () => {
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, comments: [validComment] },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a widget with an invalid type', () => {
    const badWidget = { ...validWidget, type: 'not_a_real_type' }
    const result = importSiteSchema.safeParse({
      ...basePayload,
      data: { ...validExportData, widgets: [badWidget] },
    })
    expect(result.success).toBe(false)
  })
})
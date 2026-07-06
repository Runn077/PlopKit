import { describe, it, expect } from 'vitest'
import { createWidgetSchema, updateWidgetSchema } from '../widget.validators.js'
import { WidgetType } from '../../generated/prisma/enums.js'

describe('createWidgetSchema', () => {
  it('accepts a valid widget payload', () => {
    const result = createWidgetSchema.safeParse({
      siteId: 'site_123',
      type: WidgetType.comments,
      name: 'My Widget',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty siteId', () => {
    const result = createWidgetSchema.safeParse({
      siteId: '',
      type: WidgetType.comments,
      name: 'My Widget',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = createWidgetSchema.safeParse({
      siteId: 'site_123',
      type: WidgetType.comments,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid type', () => {
    const result = createWidgetSchema.safeParse({
      siteId: 'site_123',
      type: 'not_a_real_type',
      name: 'My Widget',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing siteId', () => {
    const result = createWidgetSchema.safeParse({
      type: WidgetType.comments,
      name: 'My Widget',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing type', () => {
    const result = createWidgetSchema.safeParse({
      siteId: 'site_123',
      name: 'My Widget',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing name', () => {
    const result = createWidgetSchema.safeParse({
      siteId: 'site_123',
      type: WidgetType.comments,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateWidgetSchema', () => {
  it('accepts an empty object since all fields are optional', () => {
    const result = updateWidgetSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a partial update with just name', () => {
    const result = updateWidgetSchema.safeParse({ name: 'Renamed' })
    expect(result.success).toBe(true)
  })

  it('accepts a partial update with just autoApprove', () => {
    const result = updateWidgetSchema.safeParse({ autoApprove: true })
    expect(result.success).toBe(true)
  })

  it('rejects an empty string name if provided', () => {
    const result = updateWidgetSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-boolean autoApprove', () => {
    const result = updateWidgetSchema.safeParse({ autoApprove: 'yes' })
    expect(result.success).toBe(false)
  })
})
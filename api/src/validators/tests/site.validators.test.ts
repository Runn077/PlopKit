import { describe, it, expect } from 'vitest'
import { domainSchema, createSiteSchema, updateSiteSchema } from '../site.validators.js'

describe('domainSchema', () => {
  it('accepts a standard domain', () => {
    expect(domainSchema.safeParse('example.com').success).toBe(true)
  })

  it('accepts a subdomain', () => {
    expect(domainSchema.safeParse('blog.example.com').success).toBe(true)
  })

  it('accepts localhost', () => {
    expect(domainSchema.safeParse('localhost').success).toBe(true)
  })

  it('accepts a domain with hyphens', () => {
    expect(domainSchema.safeParse('my-site.example.com').success).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(domainSchema.safeParse('').success).toBe(false)
  })

  it('rejects a domain with no TLD', () => {
    expect(domainSchema.safeParse('example').success).toBe(false)
  })

  it('rejects a domain with a single-letter TLD', () => {
    expect(domainSchema.safeParse('example.c').success).toBe(false)
  })

  it('rejects a domain starting with a hyphen', () => {
    expect(domainSchema.safeParse('-example.com').success).toBe(false)
  })

  it('rejects a domain ending with a hyphen before the dot', () => {
    expect(domainSchema.safeParse('example-.com').success).toBe(false)
  })

  it('rejects a domain with a protocol prefix', () => {
    expect(domainSchema.safeParse('https://example.com').success).toBe(false)
  })

  it('rejects a domain with a path suffix', () => {
    expect(domainSchema.safeParse('example.com/path').success).toBe(false)
  })

  it('rejects localhost with a port', () => {
    expect(domainSchema.safeParse('localhost:3000').success).toBe(false)
  })

  it('rejects a domain with spaces', () => {
    expect(domainSchema.safeParse('example .com').success).toBe(false)
  })
})

describe('createSiteSchema', () => {
  it('accepts a valid site payload', () => {
    const result = createSiteSchema.safeParse({
      name: 'My Blog',
      domain: 'example.com',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = createSiteSchema.safeParse({
      name: '',
      domain: 'example.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid domain', () => {
    const result = createSiteSchema.safeParse({
      name: 'My Blog',
      domain: 'not a domain',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a missing domain', () => {
    const result = createSiteSchema.safeParse({
      name: 'My Blog',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateSiteSchema', () => {
  it('accepts an empty object since all fields are optional', () => {
    expect(updateSiteSchema.safeParse({}).success).toBe(true)
  })

  it('accepts a partial update with just name', () => {
    expect(updateSiteSchema.safeParse({ name: 'Renamed' }).success).toBe(true)
  })

  it('accepts a partial update with just domain', () => {
    expect(updateSiteSchema.safeParse({ domain: 'newdomain.com' }).success).toBe(true)
  })

  it('rejects an invalid domain if provided', () => {
    expect(updateSiteSchema.safeParse({ domain: 'nope' }).success).toBe(false)
  })

  it('rejects an empty string name if provided', () => {
    expect(updateSiteSchema.safeParse({ name: '' }).success).toBe(false)
  })
})
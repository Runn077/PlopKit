import { describe, it, expect } from 'vitest'
import { themeSchema, updateThemeSchema } from '../theme.validators.js'

describe('themeSchema', () => {
  it('accepts null theme', () => {
    const result = themeSchema.safeParse(null)
    expect(result.success).toBe(true)
  })

  it('accepts undefined theme', () => {
    const result = themeSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it('accepts an empty tokens object', () => {
    const result = themeSchema.safeParse({ tokens: {} })
    expect(result.success).toBe(true)
  })

  it('accepts a valid full set of tokens', () => {
    const result = themeSchema.safeParse({
      tokens: {
        colorText: '#0f0f0f',
        widgetBg: 'transparent',
        widgetRadius: '12px',
        widgetPadding: '10px',
        fontFamily: '"Arial Black", sans-serif',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown token key', () => {
    const result = themeSchema.safeParse({
      tokens: { notARealToken: '#fff' },
    })
    expect(result.success).toBe(false)
  })

  // --- color tokens ---
  describe('color tokens', () => {
    it('accepts a 6-digit hex color', () => {
      const result = themeSchema.safeParse({ tokens: { colorText: '#0f0f0f' } })
      expect(result.success).toBe(true)
    })

    it('accepts a 3-digit hex color', () => {
      const result = themeSchema.safeParse({ tokens: { colorText: '#fff' } })
      expect(result.success).toBe(true)
    })

    it('accepts an 8-digit hex color with alpha', () => {
      const result = themeSchema.safeParse({ tokens: { colorText: '#ffffffaa' } })
      expect(result.success).toBe(true)
    })

    it('accepts "transparent"', () => {
      const result = themeSchema.safeParse({ tokens: { widgetBg: 'transparent' } })
      expect(result.success).toBe(true)
    })

    it('rejects a named color', () => {
      const result = themeSchema.safeParse({ tokens: { colorText: 'red' } })
      expect(result.success).toBe(false)
    })

    it('rejects rgb() syntax', () => {
      const result = themeSchema.safeParse({ tokens: { colorText: 'rgb(0,0,0)' } })
      expect(result.success).toBe(false)
    })

    it('rejects a CSS injection attempt', () => {
      const result = themeSchema.safeParse({
        tokens: { colorText: 'red; } body { display:none' },
      })
      expect(result.success).toBe(false)
    })
  })

  // --- radius tokens ---
  describe('radius tokens', () => {
    it('accepts a px value within range', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '12px' } })
      expect(result.success).toBe(true)
    })

    it('accepts a rem value within range', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '1.5rem' } })
      expect(result.success).toBe(true)
    })

    it('accepts the maximum boundary (999px)', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '999px' } })
      expect(result.success).toBe(true)
    })

    it('accepts 0px', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '0px' } })
      expect(result.success).toBe(true)
    })

    it('rejects a value over the max', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '1000px' } })
      expect(result.success).toBe(false)
    })

    it('rejects a unitless number', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '12' } })
      expect(result.success).toBe(false)
    })

    it('rejects a negative value', () => {
      const result = themeSchema.safeParse({ tokens: { widgetRadius: '-5px' } })
      expect(result.success).toBe(false)
    })
  })

  // --- spacing tokens ---
  describe('spacing tokens', () => {
    it('accepts a px value within range', () => {
      const result = themeSchema.safeParse({ tokens: { cardPadding: '12px' } })
      expect(result.success).toBe(true)
    })

    it('accepts the maximum boundary (100px)', () => {
      const result = themeSchema.safeParse({ tokens: { cardPadding: '100px' } })
      expect(result.success).toBe(true)
    })

    it('rejects a value over the max', () => {
      const result = themeSchema.safeParse({ tokens: { cardPadding: '101px' } })
      expect(result.success).toBe(false)
    })

    it('rejects a value that would be fine for radius but not spacing', () => {
      const result = themeSchema.safeParse({ tokens: { cardPadding: '500px' } })
      expect(result.success).toBe(false)
    })
  })

  // --- font tokens ---
describe('font tokens', () => {
  it('accepts a font from the allowed list', () => {
    const result = themeSchema.safeParse({
      tokens: { fontFamily: 'Arial, sans-serif' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts an empty string (no font override)', () => {
    const result = themeSchema.safeParse({ tokens: { fontFamily: '' } })
    expect(result.success).toBe(true)
  })

  it('accepts a quoted multi-word font from the list', () => {
    const result = themeSchema.safeParse({
      tokens: { fontFamily: '"Trebuchet MS", sans-serif' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a font not in the allowed list', () => {
    const result = themeSchema.safeParse({
      tokens: { fontFamily: '"Comic Sans MS", cursive' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a url() injection attempt', () => {
    const result = themeSchema.safeParse({
      tokens: { fontFamily: 'url(javascript:alert(1)), sans-serif' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects a value with a semicolon', () => {
    const result = themeSchema.safeParse({
      tokens: { fontFamily: 'Arial; } body { color:red' },
    })
    expect(result.success).toBe(false)
  })
})

  // --- length limits ---
  describe('length limits', () => {
    it('rejects an excessively long string', () => {
      const result = themeSchema.safeParse({
        tokens: { colorText: '#fff' + 'a'.repeat(200) },
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('updateThemeSchema', () => {
  it('accepts a payload with a null theme', () => {
    const result = updateThemeSchema.safeParse({ theme: null })
    expect(result.success).toBe(true)
  })

  it('accepts a payload with a valid theme', () => {
    const result = updateThemeSchema.safeParse({
      theme: { tokens: { colorText: '#0f0f0f' } },
    })
    expect(result.success).toBe(true)
  })

  it('rejects a payload with an invalid token inside theme', () => {
    const result = updateThemeSchema.safeParse({
      theme: { tokens: { colorText: 'not-a-color' } },
    })
    expect(result.success).toBe(false)
  })
})
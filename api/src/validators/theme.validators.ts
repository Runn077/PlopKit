import { z } from 'zod'
import { THEME_TOKEN_DEFS, type ThemeTokenType } from '../constants/themeTokens.js'
import allowedFonts from '../constants/fonts.json' with { type: 'json' }

const colorRegex = /^(#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|transparent)$/
const lengthRegex = /^\d{1,5}(\.\d{1,2})?(px|rem)$/

const LIMITS = {
  radius: { min: 0, max: 999 },
  spacing: { min: 0, max: 100 },
}

function lengthSchema({ min, max, label }: { min: number; max: number; label: string }) {
  return z.string()
    .regex(lengthRegex, 'Must be a px or rem value (e.g. "12px" or "1.5rem")')
    .superRefine((val, ctx) => {
      const num = parseFloat(val)
      const px = val.endsWith('rem') ? num * 16 : num

      if (px > max) {
        ctx.addIssue({
          code: 'custom',
          message: `${label} exceeds the ${max}px limit`,
        })
      } else if (px < min) {
        ctx.addIssue({
          code: 'custom',
          message: `${label} cannot be below ${min}px`,
        })
      }
    })
}

const fontSet = new Set(allowedFonts as string[])

const schemasByType: Record<ThemeTokenType, z.ZodTypeAny> = {
  color: z.string().regex(colorRegex, 'Must be a hex color or "transparent"'),
  radius: lengthSchema({ ...LIMITS.radius, label: 'Radius' }),
  spacing: lengthSchema({ ...LIMITS.spacing, label: 'Padding' }),
  font: z.string().max(150).refine(val => val === '' || fontSet.has(val), 'Unsupported font'),
  text: z.string().max(100),
}

const themeTokensSchema = z.object(
  Object.fromEntries(
    THEME_TOKEN_DEFS.map(({ key, type }) => [key, schemasByType[type].optional()])
  )
).strict()

export const themeSchema = z.object({
  tokens: themeTokensSchema,
}).nullable().optional()

export const updateThemeSchema = z.object({
  theme: themeSchema,
})
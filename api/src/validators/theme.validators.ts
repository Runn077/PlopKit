import { z } from 'zod'
import { THEME_TOKEN_DEFS, type ThemeTokenType } from '../constants/themeTokens.js'

const colorRegex = /^(#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|transparent)$/
const lengthRegex = /^\d{1,3}(\.\d{1,2})?(px|rem)$/

const LIMITS = {
  radius: { min: 0, max: 999 },
  spacing: { min: 0, max: 100 },
}

const fontFamilyRegex = /^("[a-zA-Z0-9 ]{1,40}"|[a-zA-Z][a-zA-Z0-9 ]{0,40})(,\s*("[a-zA-Z0-9 ]{1,40}"|[a-zA-Z][a-zA-Z0-9 ]{0,40}))*,\s*(sans-serif|serif|monospace|cursive|fantasy|system-ui)$/

function lengthSchema({ min, max }: { min: number; max: number }) {
  return z.string()
    .regex(lengthRegex, 'Must be a px or rem value')
    .refine(val => {
      const num = parseFloat(val)
      const px = val.endsWith('rem') ? num * 16 : num
      return px >= min && px <= max
    }, `Must be between ${min} and ${max}px`)
}

const schemasByType: Record<ThemeTokenType, z.ZodTypeAny> = {
  color: z.string().regex(colorRegex, 'Must be a hex color or "transparent"'),
  radius: lengthSchema(LIMITS.radius),
  spacing: lengthSchema(LIMITS.spacing),
  font: z.string().max(150).regex(fontFamilyRegex, 'Invalid font family value'),
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
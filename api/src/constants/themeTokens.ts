export const THEME_TOKEN_KEYS = [
  'fontFamily',
  'fontFamilyBody',
  'colorText',
  'colorPrimary',
  'colorDanger',
  'inputBg',
  'inputTextColor',
  'inputBorder',
  'btnPostBg',
  'btnPostText',
  'radius',
  'dividerColor',
  'cardBg',
  'cardTextColor',
  'replyBg',
  'replyTextColor',
  'quoteAccent',
  'badgeOwner',
  'badgePinned',
] as const

export type ThemeTokenKey = typeof THEME_TOKEN_KEYS[number]
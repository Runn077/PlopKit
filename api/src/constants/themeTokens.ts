export type ThemeTokenType = 'color' | 'radius' | 'spacing' | 'font' | 'text'

export interface ThemeTokenDef {
  key: string
  type: ThemeTokenType
}

export const THEME_TOKEN_DEFS: ThemeTokenDef[] = [
  { key: 'fontFamily', type: 'font' },
  { key: 'fontFamilyBody', type: 'font' },
  { key: 'colorText', type: 'color' },
  { key: 'colorPrimary', type: 'color' },
  { key: 'colorDanger', type: 'color' },
  { key: 'inputBg', type: 'color' },
  { key: 'inputTextColor', type: 'color' },
  { key: 'inputBorder', type: 'color' },
  { key: 'btnPostBg', type: 'color' },
  { key: 'btnPostText', type: 'color' },
  { key: 'btnPostRadius', type: 'radius' },
  { key: 'inputRadius', type: 'radius' },
  { key: 'widgetBg', type: 'color' },
  { key: 'widgetRadius', type: 'radius' },
  { key: 'widgetPadding', type: 'spacing' },
  { key: 'inputAreaPadding', type: 'spacing' },
  { key: 'cardPadding', type: 'spacing' },
  { key: 'replyPadding', type: 'spacing' },
  { key: 'cardRadius', type: 'radius' },
  { key: 'replyRadius', type: 'radius' },
  { key: 'dividerColor', type: 'color' },
  { key: 'cardBg', type: 'color' },
  { key: 'cardTextColor', type: 'color' },
  { key: 'replyBg', type: 'color' },
  { key: 'replyTextColor', type: 'color' },
  { key: 'quoteAccent', type: 'color' },
  { key: 'badgeOwner', type: 'color' },
  { key: 'badgePinned', type: 'color' },
  { key: 'badgeTextColor', type: 'color' },
  { key: 'toastBg', type: 'color' },
  { key: 'toastTextColor', type: 'color' },
  { key: 'toastRadius', type: 'radius' },
]

export const THEME_TOKEN_KEYS = THEME_TOKEN_DEFS.map(t => t.key) as [string, ...string[]]
export type ThemeTokenKey = typeof THEME_TOKEN_KEYS[number]
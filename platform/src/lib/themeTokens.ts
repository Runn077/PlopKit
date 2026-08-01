export type ThemeTokenType = 'color' | 'text' | 'font'

export interface ThemeTokenDef {
  key: string
  group: string
  label: string
  type: ThemeTokenType
  default: string
  min?: number
  max?: number
}

export const THEME_LIMITS = {
  radius: { min: 0, max: 999 },
  spacing: { min: 0, max: 100 },
} as const

export const THEME_TOKENS: ThemeTokenDef[] = [
  { key: 'fontFamily', group: 'General', label: 'Font', type: 'font', default: '' },
  { key: 'fontFamilyBody', group: 'General', label: 'Comment Body', type: 'font', default: '' },
  { key: 'colorText', group: 'General', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'colorPrimary', group: 'General', label: 'Accent Color', type: 'color', default: '#0f0f0f' },
  { key: 'dividerColor', group: 'General', label: 'Divider Color', type: 'color', default: '#f0f0f0' },
  { key: 'widgetBg', group: 'General', label: 'Widget Background', type: 'color', default: 'transparent' },
  { key: 'widgetRadius', group: 'General', label: 'Widget Corner Radius', type: 'text', default: '0px', ...THEME_LIMITS.radius },
  { key: 'widgetPadding', group: 'General', label: 'Widget Padding', type: 'text', default: '10px', ...THEME_LIMITS.spacing },

  { key: 'inputBg', group: 'Input Area', label: 'Background', type: 'color', default: '#ffffff' },
  { key: 'inputTextColor', group: 'Input Area', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'inputBorder', group: 'Input Area', label: 'Border Color', type: 'color', default: '#cccccc' },
  { key: 'btnPostBg', group: 'Input Area', label: 'Post Button Background', type: 'color', default: '#0f0f0f' },
  { key: 'btnPostText', group: 'Input Area', label: 'Post Button Text', type: 'color', default: '#ffffff' },
  { key: 'inputRadius', group: 'Input Area', label: 'Input Corner Radius', type: 'text', default: '10px', ...THEME_LIMITS.radius },
  { key: 'inputAreaPadding', group: 'Input Area', label: 'Input Area Padding', type: 'text', default: '0px', ...THEME_LIMITS.spacing },
  { key: 'btnPostRadius', group: 'Input Area', label: 'Post Button Corner Radius', type: 'text', default: '999px', ...THEME_LIMITS.radius },

  { key: 'cardBg', group: 'Comment Card', label: 'Background', type: 'color', default: 'transparent' },
  { key: 'cardTextColor', group: 'Comment Card', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'cardRadius', group: 'Comment Card', label: 'Corner Radius', type: 'text', default: '0px', ...THEME_LIMITS.radius },
  { key: 'cardPadding', group: 'Comment Card', label: 'Comment Card Padding', type: 'text', default: '12px', ...THEME_LIMITS.spacing },

  { key: 'replyBg', group: 'Reply Card', label: 'Background', type: 'color', default: 'transparent' },
  { key: 'replyTextColor', group: 'Reply Card', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'quoteAccent', group: 'Reply Card', label: 'Quote Accent', type: 'color', default: '#ffe66d' },
  { key: 'replyRadius', group: 'Reply Card', label: 'Corner Radius', type: 'text', default: '0px', ...THEME_LIMITS.radius },
  { key: 'replyPadding', group: 'Reply Card', label: 'Reply Card Padding', type: 'text', default: '8px', ...THEME_LIMITS.spacing },

  { key: 'colorDanger', group: 'Badges & Delete', label: 'Delete Button', type: 'color', default: '#ff4444' },
  { key: 'badgeOwner', group: 'Badges & Delete', label: 'Owner Badge', type: 'color', default: '#4ecdc4' },
  { key: 'badgePinned', group: 'Badges & Delete', label: 'Pinned Badge', type: 'color', default: '#999999' },
  { key: 'badgeTextColor', group: 'Badges & Delete', label: 'Badge Text Color', type: 'color', default: '#ffffff' },

  { key: 'toastBg', group: 'Toast', label: 'Background', type: 'color', default: '#ff6b6b' },
  { key: 'toastTextColor', group: 'Toast', label: 'Text Color', type: 'color', default: '#ffffff' },
  { key: 'toastRadius', group: 'Toast', label: 'Corner Radius', type: 'text', default: '999px', ...THEME_LIMITS.radius },
]

export const THEME_GROUPS = [...new Set(THEME_TOKENS.map(t => t.group))]

export type ThemeTokens = Record<string, string | undefined>
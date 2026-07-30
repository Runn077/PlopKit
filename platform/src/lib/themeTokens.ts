export type ThemeTokenType = 'color' | 'text' | 'font'

export interface ThemeTokenDef {
  key: string
  group: string
  label: string
  type: ThemeTokenType
  default: string
}

export const THEME_TOKENS: ThemeTokenDef[] = [
  { key: 'fontFamily', group: 'General', label: 'Font', type: 'font', default: '' },
  { key: 'fontFamilyBody', group: 'General', label: 'Comment Text Font (optional)', type: 'font', default: '' },
  { key: 'colorText', group: 'General', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'colorPrimary', group: 'General', label: 'Accent Color', type: 'color', default: '#0f0f0f' },
  { key: 'radius', group: 'General', label: 'Input Corner Radius', type: 'text', default: '10px' },
  { key: 'dividerColor', group: 'General', label: 'Divider Color', type: 'color', default: '#f0f0f0' },
  { key: 'widgetBg', group: 'General', label: 'Widget Background', type: 'color', default: 'transparent' },

  { key: 'inputBg', group: 'Input Area', label: 'Background', type: 'color', default: '#ffffff' },
  { key: 'inputTextColor', group: 'Input Area', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'inputBorder', group: 'Input Area', label: 'Border Color', type: 'color', default: '#cccccc' },
  { key: 'btnPostBg', group: 'Input Area', label: 'Post Button Background', type: 'color', default: '#0f0f0f' },
  { key: 'btnPostText', group: 'Input Area', label: 'Post Button Text', type: 'color', default: '#ffffff' },

  { key: 'cardBg', group: 'Comment Card', label: 'Background', type: 'color', default: 'transparent' },
  { key: 'cardTextColor', group: 'Comment Card', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'cardRadius', group: 'Comment Card', label: 'Corner Radius', type: 'text', default: '0px' },

  { key: 'replyBg', group: 'Reply Card', label: 'Background', type: 'color', default: 'transparent' },
  { key: 'replyTextColor', group: 'Reply Card', label: 'Text Color', type: 'color', default: '#0f0f0f' },
  { key: 'quoteAccent', group: 'Reply Card', label: 'Quote Accent', type: 'color', default: '#ffe66d' },
  { key: 'replyRadius', group: 'Reply Card', label: 'Corner Radius', type: 'text', default: '0px' },

  { key: 'colorDanger', group: 'Badges & Accents', label: 'Delete Button', type: 'color', default: '#ff4444' },
  { key: 'badgeOwner', group: 'Badges & Accents', label: 'Owner Badge', type: 'color', default: '#4ecdc4' },
  { key: 'badgePinned', group: 'Badges & Accents', label: 'Pinned Badge', type: 'color', default: '#999999' },
]

export const THEME_GROUPS = [...new Set(THEME_TOKENS.map(t => t.group))]

export type ThemeTokens = Record<string, string | undefined>
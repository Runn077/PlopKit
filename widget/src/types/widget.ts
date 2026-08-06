export interface ThemeTokens {
  fontFamily?: string
  fontFamilyBody?: string
  colorText?: string
  colorPrimary?: string
  colorDanger?: string
  inputBg?: string
  inputTextColor?: string
  inputBorder?: string
  btnPostBg?: string
  btnPostText?: string
  inputRadius?: string
  widgetBg?: string
  widgetRadius?: string
  cardRadius?: string
  replyRadius?: string
  dividerColor?: string
  cardBg?: string
  cardTextColor?: string
  replyBg?: string
  replyTextColor?: string
  quoteAccent?: string
  badgeOwner?: string
  badgePinned?: string
  toastBg?: string
  toastTextColor?: string
  toastRadius?: string
  widgetPadding?: string
  inputAreaPadding?: string
  cardPadding?: string
  replyPadding?: string
  btnPostRadius?: string
  badgeTextColor?: string
}

export interface BaseWidgetProps {
  widgetKey: string
  pageUrl: string
  shadowRoot: ShadowRoot
  theme?: {
    tokens: ThemeTokens
  } | null
  preview?: boolean
}
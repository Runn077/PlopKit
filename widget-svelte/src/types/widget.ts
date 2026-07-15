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
  radius?: string
  dividerColor?: string
  cardBg?: string
  cardTextColor?: string
  replyBg?: string
  replyTextColor?: string
  quoteAccent?: string
  badgeOwner?: string
  badgePinned?: string
}

export interface BaseWidgetProps {
  widgetKey: string
  pageUrl: string
  shadowRoot: ShadowRoot
  theme?: {
    tokens: ThemeTokens
  } | null
}
import { useEffect, useRef, useState } from 'react'
import { THEME_TOKENS } from '../lib/themeTokens'
import type { ThemeTokens } from '../types'

const PREVIEW_WIDGET_KEY = 'preview-key'
const PREVIEW_INSTANCE_ID = `plopkit-${PREVIEW_WIDGET_KEY}`

function cssVarName(key: string) {
  return '--pkw-' + key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function useThemePreview(tokens: ThemeTokens) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [hostReady, setHostReady] = useState(false)

  useEffect(() => {
    if (!previewRef.current) return
    if (document.getElementById(PREVIEW_INSTANCE_ID)) return

    const script = document.createElement('script')
    script.src = '/widget.js'
    script.setAttribute('data-widget-key', PREVIEW_WIDGET_KEY)
    script.setAttribute('data-preview', 'true')
    previewRef.current.appendChild(script)

    const observer = new MutationObserver(() => {
      if (document.getElementById(PREVIEW_INSTANCE_ID)) {
        setHostReady(true)
        observer.disconnect()
      }
    })
    observer.observe(previewRef.current, { childList: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hostReady) return
    const host = document.getElementById(PREVIEW_INSTANCE_ID)
    if (!host) return
    for (const token of THEME_TOKENS) {
      const value = tokens[token.key]
      if (value) {
        host.style.setProperty(cssVarName(token.key), value)
      } else {
        host.style.removeProperty(cssVarName(token.key))
      }
    }
  }, [tokens, hostReady])

  return previewRef
}
import { mount } from 'svelte'
import Comments from './widgets/comments/index.svelte'
import type { BaseWidgetProps } from './types'

const script = document.currentScript as HTMLScriptElement
const widgetKey = script?.getAttribute('data-widget-key') ?? ''
const widget = script?.getAttribute('data-widget') ?? 'comments'

async function fetchWidgetConfig(widgetKey: string) {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/widget-config?widget_key=${widgetKey}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.theme ?? null
  } catch {
    return null
  }
}

async function init() {
  const instanceId = `plopkit-${widgetKey}`
  if (document.getElementById(instanceId)) return

  const host = document.createElement('div')
  host.id = instanceId
  host.style.width = '100%'
  script.parentNode?.insertBefore(host, script.nextSibling)

  const shadow = host.attachShadow({ mode: 'open' })
  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  if (widget === 'comments') {
    const theme = await fetchWidgetConfig(widgetKey)

    mount(Comments, {
      target: mountPoint,
      props: { widgetKey, pageUrl: window.location.href, shadowRoot: shadow, theme } as BaseWidgetProps,
    })
  }
}

init()
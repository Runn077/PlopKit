import { mount } from 'svelte'
import Comments from './widgets/comments/index.svelte'
import type { BaseWidgetProps } from './types'

const script = document.currentScript as HTMLScriptElement
const widgetKey = script?.getAttribute('data-widget-key') ?? ''
const widget = script?.getAttribute('data-widget') ?? 'comments'

const instanceId = `plopkit-${widgetKey}`
if (!document.getElementById(instanceId)) {
  const host = document.createElement('div')
  host.id = instanceId
  host.style.width = '100%'
  script.parentNode?.insertBefore(host, script.nextSibling)

  const shadow = host.attachShadow({ mode: 'open' })
  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  if (widget === 'comments') {
    mount(Comments, {
      target: mountPoint,
      props: { widgetKey, pageUrl: window.location.href, shadowRoot: shadow } as BaseWidgetProps,
    })
  }
}
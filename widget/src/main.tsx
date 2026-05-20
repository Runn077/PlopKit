import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Comments from './widgets/comments/Comments'

const script = document.currentScript as HTMLScriptElement
const widgetKey = script?.getAttribute('data-widget-key') ?? ''
const widget = script?.getAttribute('data-widget') ?? 'comments'

const host = document.createElement('div')
host.style.width = '100%'
script.parentNode?.insertBefore(host, script.nextSibling)

const shadow = host.attachShadow({ mode: 'open' })
const mountPoint = document.createElement('div')
shadow.appendChild(mountPoint)

const widgetMap: Record<string, React.ComponentType<any>> = {
  comments: Comments,
}

const Widget = widgetMap[widget]
if (Widget) {
  createRoot(mountPoint).render(
    <StrictMode>
      <Widget widgetKey={widgetKey} pageUrl={window.location.href} />
    </StrictMode>
  )
}
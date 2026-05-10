import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Comments from './widgtes/comments/Comments'

const script = document.currentScript as HTMLScriptElement
const siteKey = script?.getAttribute('data-site-key') ?? ''
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
      <Widget siteKey={siteKey} pageUrl={window.location.href} />
    </StrictMode>
  )
}
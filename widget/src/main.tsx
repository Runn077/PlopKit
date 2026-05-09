import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const script = document.currentScript as HTMLScriptElement
const siteKey = script?.getAttribute('data-site-key') ?? ''

const host = document.createElement('div')
document.body.appendChild(host)

const shadow = host.attachShadow({ mode: 'open' })

const mountPoint = document.createElement('div')
shadow.appendChild(mountPoint)

createRoot(mountPoint).render(
  <StrictMode>
    <App siteKey={siteKey} pageUrl={window.location.href} />
  </StrictMode>
)
import LandingNavbar from "../../components/LandingNavbar"
import { useEffect, useRef } from "react"
import './Demo.css'

export default function DemoPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = `${import.meta.env.VITE_APP_URL}/widget.js`
    script.setAttribute('data-widget-key', import.meta.env.VITE_DEMO_WIDGET_KEY)
    script.setAttribute('data-widget', 'comments')
    containerRef.current?.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return (
    <div>
      <LandingNavbar />
      <div className="demo-container">
        <h1 className="demo-heading">Try it yourself</h1>
        <p className="demo-subheading">This is a live PlopKit comment widget.</p>
        <div ref={containerRef} />
      </div>
    </div>
  )
}
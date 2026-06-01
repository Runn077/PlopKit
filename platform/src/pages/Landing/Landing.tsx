import { useEffect, useRef } from 'react'
import './Landing.css'
import Footer from '../../components/Footer'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const widgetRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const container = widgetRef.current

    if (!container) return

    const script = document.createElement('script')

    script.src = 'http://localhost:5173/widget.js'
    script.setAttribute(
      'data-widget-key',
      '062add3f97441b86015149ebb8d94682'
    )
    script.setAttribute('data-widget', 'comments')

    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [])

  return (
    <div className="landing-page">
      <nav className="navbar-landing">
        <div className="logo">PlopKit</div>

        <div className="nav-links">
          <button>About</button>
          <button>Pricing</button>
          <button>Docs</button>
          <button onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </nav>

      <main className="hero">
        <h1>
          Embedded Comments
          <br />
          and Stuff
        </h1>

        <p className="hero-subtitle">
          Add comments to any website with a single script tag.
        </p>

        <div className="hero-actions">
          <button className="primary-btn" onClick={() => navigate('/signup')}>
            Start Free
          </button>

          <button className="secondary-btn">
            View Demo
          </button>
        </div>

        <div className="widget-preview">
          <div className="browser-header">
          </div>

          <div className="browser-content">
            <div
              ref={widgetRef}
              className="widget-embed"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
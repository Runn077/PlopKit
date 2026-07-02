import './Landing.css'
import Footer from '../../components/Footer'
import { useEffect } from 'react'
import { useNavigate, useLocation} from 'react-router-dom'
import LandingNavbar from '../../components/LandingNavbar'

export default function LandingPage() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.scrollTo === 'pricing-section') {
      document.getElementById('pricing-section')?.scrollIntoView({
        behavior: 'smooth'
      })
    }
  }, [location])

  return (
    <div className="landing-page">
      <LandingNavbar />
      <main className="hero">
        <h1>
           Anonymous Comments
        </h1>
        <img className="logo" src="/logo.svg" alt="PlopKit" />
        <p className="hero-subtitle">
          Fully open source, no signup for commenters, just start commenting!
        </p>

        <div className="hero-actions">
          <button className="primary-btn" onClick={() => navigate('/signup')}>
            Start Free
          </button>

          <a className="secondary-btn github-btn" 
            href="https://github.com/Runn077/PlopKit" 
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="View source on GitHub">
            <svg viewBox="0 0 24 24" width="26" height="26">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z"/>
            </svg>
          </a>
        </div>
      </main>

      {/* WORKFLOW */}
      <section className="workflow-section">
        <h2 className="section-title">How It Works</h2>

        <div className="workflow-grid">

          <div className="step-card step-1">
            <span className="step-num">01</span>
            <h3 className="step-label">Create Account</h3>
            <p className="step-desc">
              Sign up for free in seconds. No credit card required.
            </p>
          </div>

          <div className="step-card step-2">
            <span className="step-num">02</span>
            <h3 className="step-label">Add Your Site</h3>
            <p className="step-desc">
              Register your domain so we know where widgets will live.
            </p>
          </div>

          <div className="step-card step-3">
            <span className="step-num">03</span>
            <h3 className="step-label">Add a Widget</h3>
            <p className="step-desc">
              Name the widget and configure it from your dashboard.
            </p>
          </div>

          <div className="step-card step-4">
            <span className="step-num">04</span>
            <h3 className="step-label">Copy & Paste Script</h3>
            <p className="step-desc">
              One script tag. Drop it anywhere in your HTML.
            </p>
          </div>

          <div className="step-card step-5">
            <div className="step-5-inner">

              <div className="step-5-left">
                <span className="step-num">05</span>
                <h3 className="step-label">Moderate</h3>
                <p className="step-desc">Manage your community from a single dashboard.</p>
                <ul className="mod-features">
                  <li> Pin Comments</li>
                  <li> Filter Words</li>
                  <li> Accept / Reject / Delete Comments</li>
                </ul>
              </div>

              <div className="step-5-right">
                <p className="embed-headline">All from a single script tag.</p>
                <div className="embed-code-block">
                  <code className="embed-code">
                    {`<script src="https://plopkit.com/widget.js"`}<br />
                    {`  data-widget-key="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">`}<br />
                    {`</script>`}
                  </code>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SELF HOST */}
      <section className="selfhost-section">
        <div className="selfhost-card">
          <div className="selfhost-text">
            <h2 className="section-title">Self-Host It Yourself</h2>
            <p className="selfhost-desc">
              Fully open source. Run PlopKit on your own server with
              Docker. No vendor lock-in, no usage limits, full control of your data.
            </p>
            <a
              className="selfhost-cta"
              href="https://github.com/Runn077/PlopKit"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section 
        id="pricing-section" 
        className="pricing-section"
      >
        <h2 className="section-title">Pricing</h2>
        <p className="pricing-subtitle">Cancel or upgrade anytime. No overages.</p>
        <p className="pricing-subtitle">Unlimited websites and widgets on all plans</p>
        <div className="pricing-cards">
          {[
            { tier: 'Free', price: '$0', period: 'forever', loads: '5,000', desc: 'Perfect for personal projects and experimentation.', color: 'white', cta: 'Get Started'},
            { tier: 'Hobby', price: '$5', period: '/month', loads: '150,000', desc: 'For indie developers and small sites that are growing.', color: 'var(--yellow)', cta: 'Start Hobby'},
            { tier: 'Pro', price: '$12', period: '/month', loads: '500,000', desc: 'For high-traffic sites that need serious capacity.', color: 'var(--mint)', cta: 'Go Pro'},
          ].map(plan => (
            <div key={plan.tier} className={`pricing-card 'pricing-card--featured`} style={{ background: plan.color }}>
              <div className="pricing-tier">{plan.tier}</div>
              <div className="pricing-price">
                {plan.price}
                <span className="pricing-period">{plan.period}</span>
              </div>
              <div className="pricing-loads">{plan.loads} widget loads / mo</div>
              <p className="pricing-desc">{plan.desc}</p>
              <button className="pricing-cta" onClick={() => navigate('/signup')}>{plan.cta}</button>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  )
}
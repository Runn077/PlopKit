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
          Embedded Comments
          <br />
          and Stuff
        </h1>

        <p className="hero-subtitle">
          Add anonymous comments to any website with a single script tag.
        </p>

        <div className="hero-actions">
          <button className="primary-btn" onClick={() => navigate('/signup')}>
            Start Free
          </button>

          <button className="secondary-btn" onClick={() => navigate('/demo')}>
            View Demo
          </button>
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
              Sign up free in seconds. No credit card required.
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

      {/* PRICING */}
      <section 
        id="pricing-section" 
        className="pricing-section"
      >
        <h2 className="section-title">Pricing</h2>
        <p className="pricing-subtitle">Cancel or upgrade anytime.</p>
        <p className="pricing-subtitle">No overages.</p>
        <div className="pricing-cards">
          {[
            { tier: 'Free', price: '$0', period: 'forever', loads: '10,000', desc: 'Perfect for personal projects and experimentation.', color: 'white', cta: 'Get Started'},
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
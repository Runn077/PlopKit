import './Landing.css'
import Footer from '../../components/Footer'

export default function Landing() {
  return (
    <div className="landing-container">

      <section className="landing-hero">
        <span className="landing-logo">PlopKit</span>
        <h1>Live widgets for any website</h1>
        <p>Add a widget to your site with a single script tag. No backend required.</p>
        <div className="landing-buttons">
          <a href="/signup" className="landing-btn-primary">Sign up</a>
          <a href="/login" className="landing-btn-secondary">Sign in</a>
        </div>
      </section>

      <hr className="landing-divider" />

      <section className="landing-steps">
        <div className="landing-steps-grid">
          <div className="landing-step">
            <p className="landing-step-num">01</p>
            <p className="landing-step-title">Create an account</p>
            <p className="landing-step-desc">Sign in with Google and add your site in seconds.</p>
          </div>
          <div className="landing-step">
            <p className="landing-step-num">02</p>
            <p className="landing-step-title">Add your site</p>
            <p className="landing-step-desc">Register your domain and create a comment widget.</p>
          </div>
          <div className="landing-step">
            <p className="landing-step-num">03</p>
            <p className="landing-step-title">Paste one tag</p>
            <p className="landing-step-desc">Drop a single script tag on any page. That's it.</p>
          </div>
        </div>
      </section>

      <hr className="landing-divider" />
      <Footer />
    </div>
  )
}
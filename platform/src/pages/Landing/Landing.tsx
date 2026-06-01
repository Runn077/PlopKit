import './Landing.css'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="navbar-landing">
        <div className="logo">
          PlopKit
        </div>

        <div className="nav-links">
          <button>About</button>
          <button>Pricing</button>
          <button>idk bru</button>
          <button>Login</button>
        </div>
      </nav>

      <main className="hero">
        <h1>
          Embedded Comments
          <br />
          N Stuff
        </h1>

        <div className="widget-preview">
          <div className="widget-content">
            widget goes here
          </div>
        </div>
      </main>
    </div>
  )
}
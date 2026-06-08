import { useNavigate, useLocation } from 'react-router-dom'

export default function LandingNavbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const goToPricing = () => {
    if (location.pathname === '/') {
      document.getElementById('pricing-section')?.scrollIntoView({
        behavior: 'smooth',
      })
    } else {
      navigate('/', {
        state: { scrollTo: 'pricing-section' }
      })
    }
  }

  return (
    <nav className="navbar-landing">
      <div
        className="logo"
        onClick={() => navigate('/')}
      >
        PlopKit
      </div>

      <div className="nav-links">
        <button onClick={() => navigate('/demo')}>
          Demo
        </button>

        <button onClick={goToPricing}>
          Pricing
        </button>

        <button onClick={() => navigate('/setup')}>
          Setup
        </button>

        <button onClick={() => navigate('/login')}>
          Login
        </button>
      </div>
    </nav>
  )
}
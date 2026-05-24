import { useNavigate } from 'react-router-dom'
import { useSession, signOut } from '../lib/auth-client'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <button type="button" className="navbar-brand" onClick={() => navigate('/dashboard')}>
        PlopKit
      </button>
      {session ? (
        <div className="navbar-actions">
          <button type="button" className="navbar-link" onClick={() => navigate('/account')}>
            {session.user.name ?? session.user.email}
          </button>
          <button type="button" className="navbar-btn-outline" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <button type="button" className="navbar-btn-accent" onClick={() => navigate('/login')}>
          Sign in
        </button>
      )}
    </nav>
  )
}

export default Navbar

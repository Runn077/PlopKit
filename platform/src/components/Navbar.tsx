import { useNavigate } from 'react-router-dom'
import { useSession, signOut } from '../lib/auth-client'
import { useState, useRef, useEffect } from 'react'
import './Navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="navbar">
      <button type="button" className="navbar-logo" onClick={() => navigate('/dashboard')}>
        PlopKit
      </button>

      {session ? (
        <div className="navbar-right" ref={menuRef}>
          <span className="navbar-user-name">{session.user.name ?? session.user.email}</span>
          <span className="navbar-plan-badge">{session.user.plan}</span>
          <button
            type="button"
            className={`navbar-hamburger${menuOpen ? ' is-open' : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
          {menuOpen && (
            <div className="navbar-dropdown">
              <button type="button" onClick={() => { navigate('/account'); setMenuOpen(false) }}>
                Account Settings
              </button>
              <button type="button" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" className="navbar-signin" onClick={() => navigate('/login')}>
          Sign In
        </button>
      )}
    </nav>
  )
}

export default Navbar
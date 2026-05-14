import { useNavigate } from 'react-router-dom'
import { useSession, signOut } from '../lib/auth-client'

function Navbar() {
  const navigate = useNavigate()
  const { data: session } = useSession()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav style={{
      height: '56px',
      background: '#ffffff',
      borderBottom: '1px solid #e4e2dc',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <span
      style={{
        fontFamily: 'sans-serif',
        fontSize: '18px',
        fontWeight: 600,
        color: '#9370DB',
        letterSpacing: '-0.02em',
        marginRight: 'auto',
        cursor: 'pointer',
      }}
      onClick={() => navigate('/dashboard')}
    >
      PlopKit
    </span>

      {session ? (
        <button onClick={handleSignOut} style={{
          background: 'none',
          border: '1px solid #ccc9c0',
          borderRadius: '5px',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          color: '#1a1917',
        }}>
          Sign out
        </button>
      ) : (
        <button onClick={() => navigate('/login')} style={{
          background: '#9370DB',
          border: 'none',
          borderRadius: '5px',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          color: '#fff',
        }}>
          Sign in
        </button>
      )}
    </nav>
  )
}

export default Navbar
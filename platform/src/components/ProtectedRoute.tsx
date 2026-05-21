import { useSession } from '../lib/auth-client'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending, error } = useSession()

  if (isPending) return <div className="page-loading">Loading...</div>
  if (error) return (
    <div className="page-error">
      <p className="page-error-message">Unable to connect to the server.</p>
      <button className="page-error-retry" onClick={() => window.location.reload()}>Try again</button>
    </div>
  )
  if (!session) return <Navigate to='/login' />
  return <>{children}</>
}

export default ProtectedRoute
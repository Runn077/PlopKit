import { useSession } from '../lib/auth-client'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>Loading...</div>
  if (!session) return <Navigate to='/login' />

  return <>{children}</>
}

export default ProtectedRoute
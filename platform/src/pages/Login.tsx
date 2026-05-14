import { useState } from 'react'
import { signIn } from '../lib/auth-client'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await signIn.email({
      email,
      password,
    })

    if (error) {
      setError(error.message ?? 'Something went wrong')
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div>
      < Navbar />
      <h1>Sign in to PlopKit</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input
            type='email'
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p>{error}</p>}
        <button type='submit' disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p>Don't have an account? <Link to='/signup'>Sign up</Link></p>
    </div>
  )
}

export default Login
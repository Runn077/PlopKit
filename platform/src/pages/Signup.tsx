import { useState } from 'react'
import { signUp } from '../lib/auth-client'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await signUp.email({
      name,
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
      <h1>Create your PlopKit account</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type='text'
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
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
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>
      <p>Already have an account? <Link to='/login'>Sign in</Link></p>
    </div>
  )
}

export default Signup
import { useState } from 'react'
import './Newsletter.css'

export function NewsLetter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  async function handleSubmit() {
    if (!email.trim()) return
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/public/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      setSuccess(true)
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <section className="newsletter-section">
      <div className="newsletter-card">
        <div className="newsletter-left">
          <p className="newsletter-label">Stay in the loop</p>
          <h2 className="newsletter-headline">Get notified at launch</h2>
          <p className="newsletter-sub">No spam. Just one email when PlopKit officially launches.</p>
        </div>
        <div className="newsletter-right">
          {success ? (
            <p className="newsletter-success">You're on the list!</p>
          ) : (
            <>
              <input
                className="newsletter-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              {error && <p className="newsletter-error">{error}</p>}
              <button
                className="newsletter-btn"
                onClick={handleSubmit}
                disabled={loading || !email.trim()}
              >
                {loading ? 'Submitting...' : 'Notify me'}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
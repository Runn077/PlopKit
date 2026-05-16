import { useState, useEffect, useRef } from 'react'
import './Dashboard.css'

interface Props {
  onClose: () => void
  onSubmit: (name: string, domain: string) => Promise<void>
}

function AddSiteModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(name, domain)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <p className="modal-title">Add a website</p>
        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            ref={nameRef}
            className="modal-input"
            placeholder="Website name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            className="modal-input"
            placeholder="Domain (e.g. myblog.com)"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            required
          />
          {error && <p className="modal-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add website'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddSiteModal
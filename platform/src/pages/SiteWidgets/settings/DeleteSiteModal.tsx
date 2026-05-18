import { useState, useEffect, useRef } from 'react'
import '../SiteWidgets.css'

interface Props {
  siteName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

function DeleteSiteModal({ siteName, onClose, onConfirm }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="sw-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="sw-modal">
        <p className="sw-modal-title">Delete site</p>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.5 }}>
          This will permanently delete the site and all its widgets and comments. Type <strong>{siteName}</strong> to confirm.
        </p>
        <div className="sw-modal-form">
          <input
            ref={inputRef}
            className="sw-input"
            placeholder={siteName}
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          {error && <p className="sw-modal-error">{error}</p>}
          <div className="sw-modal-actions">
            <button type="button" className="sw-btn" onClick={onClose}>Cancel</button>
            <button
              className="sw-btn sw-btn-danger-fill"
              disabled={value !== siteName || loading}
              onClick={handleConfirm}
            >
              {loading ? 'Deleting...' : 'Confirm delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteSiteModal
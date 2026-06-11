import { useState, useEffect, useRef } from 'react'

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
      className="pk-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="pk-modal">
        <p className="pk-modal-title">Delete site</p>
        <p className="pk-modal-body">
          This will permanently delete the site and all its widgets and comments. Type <strong>{siteName}</strong> to confirm.
        </p>
        <div className="pk-modal-form">
          <input
            ref={inputRef}
            className="pk-modal-input"
            placeholder={siteName}
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          {error && <p className="pk-modal-error">{error}</p>}
          <div className="pk-modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn btn-danger"
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

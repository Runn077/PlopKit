import { useState, useEffect, useRef } from 'react'
import './SiteWidgets.css'

interface Props {
  onClose: () => void
  onSubmit: (type: string, name: string) => Promise<void>
}

const WIDGET_TYPES = [
  { value: 'comments', label: 'Comments' },
]

function AddWidgetModal({ onClose, onSubmit }: Props) {
  const [type, setType] = useState('comments')
  const [name, setName] = useState('')
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
      await onSubmit(type, name)
      onClose()
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
        <p className="sw-modal-title">Add a widget</p>
        <form className="sw-modal-form" onSubmit={handleSubmit}>
          <div>
            <p className="sw-label">Widget type</p>
            <select
              className="sw-select"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {WIDGET_TYPES.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="sw-label">Name</p>
            <input
              ref={nameRef}
              className="sw-input"
              placeholder="e.g. Blog Comments"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          {error && <p className="sw-modal-error">{error}</p>}
          <div className="sw-modal-actions">
            <button type="button" className="sw-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="sw-btn sw-btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddWidgetModal
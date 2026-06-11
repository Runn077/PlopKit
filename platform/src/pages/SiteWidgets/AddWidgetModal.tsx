import { useState, useEffect, useRef } from 'react'

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
      className="pk-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="pk-modal">
        <p className="pk-modal-title">Add a widget</p>
        <form className="pk-modal-form" onSubmit={handleSubmit}>
          <div className="pk-modal-field">
            <label className="pk-modal-label">Widget type</label>
            <select
              className="pk-modal-select"
              value={type}
              onChange={e => setType(e.target.value)}
            >
              {WIDGET_TYPES.map(w => (
                <option key={w.value} value={w.value}>{w.label}</option>
              ))}
            </select>
          </div>
          <div className="pk-modal-field">
            <label className="pk-modal-label">Name</label>
            <input
              ref={nameRef}
              className="pk-modal-input"
              placeholder="e.g. Blog Comments"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          {error && <p className="pk-modal-error">{error}</p>}
          <div className="pk-modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddWidgetModal

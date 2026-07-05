import { useState, useEffect, useRef } from 'react'

interface Props {
  onClose: () => void
  onSubmit: (name: string, domain: string, data: any) => Promise<void>
}

function ImportSiteModal({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    setFile(e.target.files?.[0] ?? null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Please select an export file')
      return
    }
    setLoading(true)
    try {
      const text = await file.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('That file isn\'t valid JSON')
      }
      await onSubmit(name, domain, data)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pk-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pk-modal">
        <p className="pk-modal-title">Import a website</p>
        <form className="pk-modal-form" onSubmit={handleSubmit}>
          <div className="pk-modal-field">
            <label className="pk-modal-label">Website name</label>
            <input
              ref={nameRef}
              className="pk-modal-input"
              placeholder="My Blog"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="pk-modal-field">
            <label className="pk-modal-label">Domain</label>
            <input
              className="pk-modal-input"
              placeholder="myblog.com"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              required
            />
          </div>
          <div className="pk-modal-field">
            <label className="pk-modal-label">Export file</label>
            <input
              className="pk-modal-input"
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              required
            />
          </div>
          {error && <p className="pk-modal-error">{error}</p>}
          <div className="pk-modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Importing...' : 'Import website'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ImportSiteModal
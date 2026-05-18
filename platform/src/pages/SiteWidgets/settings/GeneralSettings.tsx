import { useState } from 'react'
import '../SiteWidgets.css'
import DeleteSiteModal from './DeleteSiteModal'

interface Site {
  id: string
  name: string
  domain: string
  siteKey: string
}

interface Props {
  site: Site
  onSave: (name: string, domain: string) => Promise<void>
  onDelete: () => Promise<void>
}

function GeneralSettings({ site, onSave, onDelete }: Props) {
  const [name, setName] = useState(site.name)
  const [domain, setDomain] = useState(site.domain)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const hasChanges = name !== site.name || domain !== site.domain

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await onSave(name, domain)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSave} style={{ marginBottom: 40 }}>
        <p className="sw-settings-section-title">General</p>
        <div className="sw-settings-fields">
          <div className="sw-field">
            <label className="sw-label">Site name</label>
            <input
              className="sw-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="sw-field">
            <label className="sw-label">Domain</label>
            <input
              className="sw-input"
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              required
            />
          </div>
        </div>
        {error && <p className="sw-settings-error">{error}</p>}
        <button
          type="submit"
          className="sw-btn sw-btn-primary"
          disabled={!hasChanges || saving}
          style={{ marginTop: 16 }}
        >
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save changes'}
        </button>
      </form>

      <div className="sw-danger-zone">
        <p className="sw-settings-section-title">Danger zone</p>
        <div className="sw-danger-row">
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>Delete this site</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              Permanently deletes this site, all widgets, and all comments.
            </p>
          </div>
          <button
            className="sw-btn sw-btn-danger-outline"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete site
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteSiteModal
          siteName={site.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

export default GeneralSettings
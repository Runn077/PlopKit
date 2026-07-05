import { useState, useEffect } from 'react'
import '../SiteWidgets.css'
import DeleteSiteModal from './DeleteSiteModal'
import type { Site } from '../../../types'
import { apiFetch } from '../../../lib/api'

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
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportSize, setExportSize] = useState<string | null>(null)

  useEffect(() => {
    async function fetchExportSize() {
      try {
        const res = await apiFetch(`/sites/${site.id}/export`, { method: 'HEAD' })
        const bytes = res.headers.get('Content-Length')
        if (bytes) setExportSize(formatBytes(Number(bytes)))
      } catch (err) {
        console.error('Export size fetch failed:', err)
      }
    }
    fetchExportSize()
  }, [site.id])

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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

  async function handleExport() {
    setExporting(true)
    setExportError('')
    try {
      const res = await apiFetch(`/sites/${site.id}/export`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `plopkit-export-${site.domain}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setExportError(err.message)
    } finally {
      setExporting(false)
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
          className="sw-btn sw-btn-primary sw-save-btn"
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save changes'}
        </button>
      </form>

      <div className="sw-verification-section">
        <p className="sw-settings-section-title">Domain verification</p>
        <div className="sw-verification-status">
          <span
            className="sw-verification-dot"
            style={{ background: site.verified ? '#22c55e' : '#f59e0b' }}
          />
          <span className="sw-verification-label">
            {site.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
        {!site.verified && (
          <p className="sw-verification-hint">
            Embed a widget on your site to verify your domain. Once a page with your widget loads, your domain will be automatically verified and locked to your account.
          </p>
        )}
      </div>

      <div className="sw-export-section">
        <p className="sw-settings-section-title">Data export</p>
        <p className="sw-export-description">
          Download all comments and widgets for this site as a JSON file.
        </p>
        {exportError && <p className="sw-settings-error">{exportError}</p>}
        <div className="sw-export-actions">
          <button
            className="sw-btn sw-btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Download export'}
          </button>
          {exportSize && <span className="sw-export-size">{exportSize}</span>}
        </div>
      </div>

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
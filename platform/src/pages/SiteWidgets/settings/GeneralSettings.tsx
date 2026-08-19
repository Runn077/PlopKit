import { useState, useEffect } from 'react'
import '../SiteWidgets.css'
import DeleteSiteModal from '../modals/DeleteSiteModal'
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
  const [allowLocalhost, setAllowLocalhost] = useState(site.allowLocalhost)
  const [savingLocalhost, setSavingLocalhost] = useState(false)
  const [localhostError, setLocalhostError] = useState('')


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

  async function handleToggleLocalhost(checked: boolean) {
    const previous = allowLocalhost
    setAllowLocalhost(checked)
    setSavingLocalhost(true)
    setLocalhostError('')
    try {
      const res = await apiFetch(`/sites/${site.id}/allow-localhost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowLocalhost: checked }),
      })
      if (!res.ok) throw new Error('Failed to update setting')
    } catch (err: any) {
      setAllowLocalhost(previous)
      setLocalhostError(err.message)
    } finally {
      setSavingLocalhost(false)
    }
  }

  return (
    <div>
      <form className="sw-general-section" onSubmit={handleSave}>
        <p className="sw-settings-section-title">General</p>
        <div className="sw-settings-fields">
          <div className="sw-field">
            <label className="sw-label">Site name</label>
            <input
              className="input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="sw-field">
            <label className="sw-label">Domain</label>
            <input
              className="input"
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              maxLength={253}
              required
            />
          </div>
        </div>
        {error && <p className="sw-settings-error">{error}</p>}
        <button
          type="submit"
          className="btn sw-btn-primary sw-save-btn"
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save changes'}
        </button>
      </form>

      <div className="sw-localhost-section">
        <p className="sw-settings-section-title">Local development</p>
        <p className="sw-export-description">
          Allow widgets to load and accept comments from localhost and 127.0.0.1,
          regardless of the domain above. Intended for testing only. Turn this off once your site is live.
        </p>
        {localhostError && <p className="sw-settings-error">{localhostError}</p>}
        <label className="sw-checkbox-row">
          <input
            type="checkbox"
            checked={allowLocalhost}
            disabled={savingLocalhost}
            onChange={e => handleToggleLocalhost(e.target.checked)}
          />
          <span>Allow localhost</span>
        </label>
      </div>

      <div className="sw-export-section">
        <p className="sw-settings-section-title">Data export</p>
        <p className="sw-export-description">
          Download all comments and widgets for this site as a JSON file.
        </p>
        {exportError && <p className="sw-settings-error">{exportError}</p>}
        <div className="sw-export-actions">
          <button
            className="btn sw-btn-primary"
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
            className="btn-red"
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
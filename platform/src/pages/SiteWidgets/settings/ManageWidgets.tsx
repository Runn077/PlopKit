import { useState } from 'react'
import '../SiteWidgets.css'

interface Widget {
  id: string
  type: string
  name: string
}

interface Props {
  widgets: Widget[]
  onOpen: (widget: Widget) => void
  onDelete: (widgetId: string) => Promise<void>
  onRename: (widgetId: string, name: string) => Promise<void>
}

function DeleteWidgetModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      await onConfirm()
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
        <p className="sw-modal-title">Delete widget</p>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.5 }}>
          This will permanently delete the widget and all its comments.
        </p>
        {error && <p className="sw-modal-error">{error}</p>}
        <div className="sw-modal-actions">
          <button className="sw-btn" onClick={onClose}>Cancel</button>
          <button
            className="sw-btn sw-btn-danger-fill"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Confirm delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WidgetRow({ widget, onOpen, onDelete, onRename }: {
  widget: Widget
  onOpen: (widget: Widget) => void
  onDelete: (widgetId: string) => Promise<void>
  onRename: (widgetId: string, name: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(widget.name)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handleRename() {
    if (!name.trim() || name === widget.name) {
      setEditing(false)
      setName(widget.name)
      return
    }
    setSaving(true)
    setError('')
    try {
      await onRename(widget.id, name)
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setEditing(false)
    setName(widget.name)
    setError('')
  }

  return (
    <div className="sw-manage-widget-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              className="sw-input"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') handleCancel()
              }}
            />
            {error && <p className="sw-modal-error">{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sw-btn sw-btn-primary" onClick={handleRename} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm'}
              </button>
              <button className="sw-btn" onClick={handleCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <p
              className="sw-manage-widget-name"
              style={{ cursor: 'pointer' }}
              onClick={() => setEditing(true)}
              title="Click to edit"
            >
              {widget.name} ✎
            </p>
            <p className="sw-manage-widget-type">{widget.type}</p>
          </div>
        )}
      </div>

      {!editing && (
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="sw-btn" onClick={() => onOpen(widget)}>Open</button>
          <button className="sw-btn sw-btn-danger-outline" onClick={() => setShowDeleteModal(true)}>Delete</button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteWidgetModal
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => onDelete(widget.id)}
        />
      )}
    </div>
  )
}

function ManageWidgets({ widgets, onOpen, onDelete, onRename }: Props) {
  if (widgets.length === 0) {
    return (
      <div>
        <p className="sw-settings-section-title">Manage widgets</p>
        <p style={{ fontSize: 14, color: '#888' }}>No widgets added yet.</p>
      </div>
    )
  }

  return (
    <div>
      <p className="sw-settings-section-title">Manage widgets</p>
      <div className="sw-manage-widget-list">
        {widgets.map(widget => (
          <WidgetRow
            key={widget.id}
            widget={widget}
            onOpen={onOpen}
            onDelete={onDelete}
            onRename={onRename}
          />
        ))}
      </div>
    </div>
  )
}

export default ManageWidgets
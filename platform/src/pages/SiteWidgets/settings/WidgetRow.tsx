import { useState } from 'react'
import type { Widget } from '../../../types'
import DeleteWidgetModal from '../modals/DeleteWidgetModal'
import './Settings.css'

interface WidgetRowProps {
  widget: Widget
  onOpen: (widget: Widget) => void
  onDelete: (widgetId: string) => Promise<void>
  onRename: (widgetId: string, name: string) => Promise<void>
}

function WidgetRow({ widget, onOpen, onDelete, onRename }: WidgetRowProps) {
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
      {editing ? (
        <div className="sw-edit-input-container">
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') handleCancel()
            }}
          />
          {error && <p className="pk-modal-error">{error}</p>}
          <div className="sw-edit-buttons-container">
            <button className="btn sw-btn-primary" onClick={handleRename} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm'}
            </button>
            <button className="btn" onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <p
            className="sw-manage-widget-name"
            onClick={() => setEditing(true)}
            title="Click to edit"
          >
            {widget.name} ✎
          </p>
          <p className="sw-manage-widget-type">{widget.type}</p>
        </div>
      )}

      {!editing && (
        <div className="sw-action-buttons-container">
          <button className="btn" onClick={() => onOpen(widget)}>Open</button>
          <button className="btn-red" onClick={() => setShowDeleteModal(true)}>Delete</button>
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

export default WidgetRow

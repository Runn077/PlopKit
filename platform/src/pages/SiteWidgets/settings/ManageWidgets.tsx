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

function ManageWidgets({ widgets, onOpen, onDelete }: Props) {
  const [deletingWidget, setDeletingWidget] = useState<Widget | null>(null)

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
          <div key={widget.id} className="sw-manage-widget-row">
            <div>
              <p className="sw-manage-widget-name">{widget.name}</p>
              <p className="sw-manage-widget-type">{widget.type}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sw-btn" onClick={() => onOpen(widget)}>Open</button>
              <button className="sw-btn sw-btn-danger-outline" onClick={() => setDeletingWidget(widget)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {deletingWidget && (
        <DeleteWidgetModal
          onClose={() => setDeletingWidget(null)}
          onConfirm={() => onDelete(deletingWidget.id)}
        />
      )}
    </div>
  )
}

export default ManageWidgets
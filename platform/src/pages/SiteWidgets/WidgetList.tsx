import { useState } from 'react'
import './SiteWidgets.css'
import type { Widget } from '../../types'

interface Props {
  widgets: Widget[]
  onOpen: (widget: Widget) => void
  onUpdateBannedWords: (widgetId: string, bannedWords: string[], autoDelete: boolean) => Promise<void>
}

const TYPE_LABELS: Record<string, string> = {
  comments: 'Comments',
}

function BannedWordsModal({ widget, onClose, onSave }: {
  widget: Widget
  onClose: () => void
  onSave: (bannedWords: string[], autoDelete: boolean) => Promise<void>
}) {
  const [words, setWords] = useState<string[]>(widget.commentWidget?.bannedWords ?? [])
  const [autoDelete, setAutoDelete] = useState(widget.commentWidget?.autoDeleteBannedWords ?? false)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleAdd() {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed) return
    if (words.includes(trimmed)) {
      setInput('')
      return
    }
    setWords(prev => [...prev, trimmed])
    setInput('')
  }

  function handleRemove(word: string) {
    setWords(prev => prev.filter(w => w !== word))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await onSave(words, autoDelete)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sw-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="sw-modal">
        <p className="sw-modal-title">Banned words — {widget.name}</p>

        <div className="sw-banned-input-row">
          <input
            className="sw-input"
            placeholder="Add a word..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="sw-btn sw-btn-primary" onClick={handleAdd} disabled={!input.trim()}>
            Add
          </button>
        </div>

        {words.length > 0 && (
          <div className="sw-banned-tags">
            {words.map(word => (
              <span key={word} className="sw-banned-tag">
                {word}
                <button className="sw-banned-tag-remove" onClick={() => handleRemove(word)}>×</button>
              </span>
            ))}
          </div>
        )}

        {words.length === 0 && (
          <p style={{ fontSize: 13, color: '#888', margin: '12px 0' }}>No banned words yet.</p>
        )}

        <div className="sw-banned-toggle-row">
          <div>
            <p style={{ fontSize: 13, fontWeight: 500 }}>Auto-delete comments</p>
            <p style={{ fontSize: 12, color: '#888' }}>Delete comments containing banned words instead of censoring</p>
          </div>
          <button
            className={`sc-toggle ${autoDelete ? 'sc-toggle-on' : ''}`}
            onClick={() => setAutoDelete(v => !v)}
          >
            <span className="sc-toggle-knob" />
          </button>
        </div>

        {error && <p className="sw-modal-error">{error}</p>}

        <div className="sw-modal-actions">
          <button className="sw-btn" onClick={onClose}>Cancel</button>
          <button className="sw-btn sw-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WidgetList({ widgets, onOpen, onUpdateBannedWords }: Props) {
  const grouped = widgets.reduce((acc, widget) => {
    if (!acc[widget.type]) acc[widget.type] = []
    acc[widget.type].push(widget)
    return acc
  }, {} as Record<string, Widget[]>)

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [settingsWidget, setSettingsWidget] = useState<Widget | null>(null)

  function toggle(type: string) {
    setCollapsed(prev => ({ ...prev, [type]: !prev[type] }))
  }

  if (widgets.length === 0) {
    return (
      <div className="sw-empty">
        <p>No widgets added yet</p>
      </div>
    )
  }

  return (
    <div>
      {Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="sw-category">
          <button className="sw-category-header" onClick={() => toggle(type)}>
            <span>
              <span className="sw-category-title">{TYPE_LABELS[type] ?? type}</span>
              <span className="sw-category-count">{items.length}</span>
            </span>
            <span className={`sw-chevron ${!collapsed[type] ? 'sw-chevron-open' : ''}`}>▼</span>
          </button>
          {!collapsed[type] && (
            <div className="sw-widget-list">
              {items.map(widget => (
                <div key={widget.id} className="sw-widget-row">
                  <span className="sw-widget-name">{widget.name}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {widget.type === 'comments' && (
                      <button
                        className="sw-btn"
                        onClick={() => setSettingsWidget(widget)}
                        title="Widget settings"
                      >
                        •••
                      </button>
                    )}
                    <button className="sw-btn" onClick={() => onOpen(widget)}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {settingsWidget && (
        <BannedWordsModal
          widget={settingsWidget}
          onClose={() => setSettingsWidget(null)}
          onSave={(bannedWords, autoDelete) =>
            onUpdateBannedWords(settingsWidget.id, bannedWords, autoDelete)
          }
        />
      )}
    </div>
  )
}

export default WidgetList
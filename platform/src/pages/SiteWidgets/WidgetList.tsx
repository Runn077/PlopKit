import { useState } from 'react'
import './SiteWidgets.css'
import type { Widget } from '../../types'

interface Props {
  widgets: Widget[]
  onOpen: (widget: Widget) => void
}

const TYPE_LABELS: Record<string, string> = {
  comments: 'Comments',
}

function WidgetList({ widgets, onOpen }: Props) {
  const grouped = widgets.reduce((acc, widget) => {
    if (!acc[widget.type]) acc[widget.type] = []
    acc[widget.type].push(widget)
    return acc
  }, {} as Record<string, Widget[]>)

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

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
                  <button className="sw-btn" onClick={() => onOpen(widget)}>Open</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default WidgetList
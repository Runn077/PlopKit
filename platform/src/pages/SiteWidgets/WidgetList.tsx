import './WidgetList.css'
import type { Widget } from '../../types'

interface Props {
  widgets: Widget[]
  onOpen: (widget: Widget) => void
}

function WidgetList({ widgets, onOpen }: Props) {
  if (widgets.length === 0) {
    return (
      <div className="widget-list-empty">
        <p>No widgets added yet.</p>
      </div>
    )
  }

  return (
    <div className="widget-list">
      {widgets.map(widget => (
        <div key={widget.id} className="widget-row">
          <div className="widget-row-info">
            <span className="widget-row-name">{widget.name}</span>
            <span className="widget-row-type">{widget.type}</span>
          </div>
          <button className="widget-row-btn" onClick={() => onOpen(widget)}>
            Open
          </button>
        </div>
      ))}
    </div>
  )
}

export default WidgetList
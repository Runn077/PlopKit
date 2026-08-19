import '../SiteWidgets.css'
import './Settings.css'
import type { Widget } from '../../../types'
import WidgetRow from './WidgetRow'

interface Props {
  widgets: Widget[]
  onOpen: (widget: Widget) => void
  onDelete: (widgetId: string) => Promise<void>
  onRename: (widgetId: string, name: string) => Promise<void>
}

function ManageWidgets({ widgets, onOpen, onDelete, onRename }: Props) {
  if (widgets.length === 0) {
    return (
      <div>
        <p className="sw-settings-section-title">Manage widgets</p>
        <p className="sw-empty-message">No widgets added yet.</p>
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
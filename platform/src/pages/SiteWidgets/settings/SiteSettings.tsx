import { useState } from 'react'
import '../SiteWidgets.css'
import SettingsSideNav from './SettingsSideNav'
import GeneralSettings from './GeneralSettings'
import ManageWidgets from './ManageWidgets'
import type { Site, Widget } from '../../../types'

type SettingsSection = 'general' | 'manage-widgets'

interface Props {
  site: Site
  widgets: Widget[]
  onSave: (name: string, domain: string) => Promise<void>
  onDelete: () => Promise<void>
  onDeleteWidget: (widgetId: string) => Promise<void>
  onOpenWidget: (widget: Widget) => void
  onRenameWidget: (widgetId: string, name: string) => Promise<void>
}

function SiteSettings({ site, widgets, onSave, onDelete, onDeleteWidget, onOpenWidget, onRenameWidget }: Props) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')

  return (
    <div className="settings-layout">
      <SettingsSideNav active={activeSection} onChange={setActiveSection} />
      <div className="settings-content">
        {activeSection === 'general' && (
          <GeneralSettings site={site} onSave={onSave} onDelete={onDelete} />
        )}
        {activeSection === 'manage-widgets' && (
          <ManageWidgets
            widgets={widgets}
            onOpen={onOpenWidget}
            onDelete={onDeleteWidget}
            onRename={onRenameWidget}
          />
        )}
      </div>
    </div>
  )
}

export default SiteSettings
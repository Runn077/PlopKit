import '../SiteWidgets.css'

type SettingsSection = 'general' | 'manage-widgets'

interface Props {
  active: SettingsSection
  onChange: (section: SettingsSection) => void
}

function SettingsSideNav({ active, onChange }: Props) {
  return (
    <div className="settings-sidenav">
      <button
        className={`settings-sidenav-item ${active === 'general' ? 'settings-sidenav-item-active' : ''}`}
        onClick={() => onChange('general')}
      >
        General
      </button>
      <button
        className={`settings-sidenav-item ${active === 'manage-widgets' ? 'settings-sidenav-item-active' : ''}`}
        onClick={() => onChange('manage-widgets')}
      >
        Manage widgets
      </button>
    </div>
  )
}

export default SettingsSideNav
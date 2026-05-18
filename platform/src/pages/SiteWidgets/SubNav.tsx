import './SiteWidgets.css'

interface Props {
  activeTab: 'widgets' | 'settings'
  onTabChange: (tab: 'widgets' | 'settings') => void
}

function SubNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="subnav">
      <button
        className={`subnav-tab ${activeTab === 'widgets' ? 'subnav-tab-active' : ''}`}
        onClick={() => onTabChange('widgets')}
      >
        Widgets
      </button>
      <button
        className={`subnav-tab ${activeTab === 'settings' ? 'subnav-tab-active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        Settings
      </button>
    </div>
  )
}

export default SubNav
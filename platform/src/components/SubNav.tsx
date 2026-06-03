import './SubNav.css'

interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tab: string) => void
}

function SubNav({ tabs, activeTab, onTabChange }: Props) {
  return (
    <div className="subnav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`subnav-tab ${activeTab === tab.id ? 'subnav-tab-active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default SubNav
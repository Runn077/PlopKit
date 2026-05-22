import './SiteComments.css'

type Tab = 'comments' | 'pending' | 'deleted' | 'filter'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

function SubNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="sc-subnav">
      <button
        className={`sc-subnav-tab ${activeTab === 'comments' ? 'sc-subnav-tab-active' : ''}`}
        onClick={() => onTabChange('comments')}
      >
        Comments
      </button>
      <button
        className={`sc-subnav-tab ${activeTab === 'pending' ? 'sc-subnav-tab-active' : ''}`}
        onClick={() => onTabChange('pending')}
      >
        Pending
      </button>
      <button
        className={`sc-subnav-tab ${activeTab === 'deleted' ? 'sc-subnav-tab-active' : ''}`}
        onClick={() => onTabChange('deleted')}
      >
        Recently Deleted
      </button>
      <button
        className={`sc-subnav-tab ${activeTab === 'filter' ? 'sc-subnav-tab-active' : ''}`}
        onClick={() => onTabChange('filter')}
      >
        Word Filter
      </button>
    </div>
  )
}

export default SubNav
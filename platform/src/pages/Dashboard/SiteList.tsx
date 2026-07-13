import './Dashboard.css'
import type { Site } from '../../types'

interface Props {
  sites: Site[]
  onManage: (id: string) => void
  onAdd: () => void
  onImport: () => void
}

function SiteList({ sites, onManage, onAdd, onImport }: Props) {
  if (sites.length === 0) {
    return (
      <div className="empty-state">
        <h2>No websites yet</h2>

        <p className='empty-state-body-text'>
          Add your first site and start collecting
          comments.
        </p>
        <div className="empty-dashboard-header-actions">
          <button
            className="btn btn-primary"
            onClick={onAdd}
          >
            + Add Website
          </button>
          <button 
            className="btn" 
            onClick={onImport}
          >
            Import site
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="site-grid">
      {sites.map(site => (
        <div 
          key={site.id}
          onClick={() => onManage(site.id)} 
          className="site-card"
        >
          <div>
            <h3 className="site-name">
              {site.name}
            </h3>

            <p className="site-domain">
              {site.domain}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default SiteList
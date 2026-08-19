import './Dashboard.css'
import type { Site } from '../../types'
import { Button } from '../../components/ui/Button/Button'

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
          <Button variant="dark" onClick={onAdd}>
            + Add Website
          </Button>
          <Button variant="light" onClick={onImport}>
            Import site
          </Button>
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
          <div className="site-card-content">
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
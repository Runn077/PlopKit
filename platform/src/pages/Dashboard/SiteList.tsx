import './Dashboard.css'
import type { Site } from '../../types'

interface Props {
  sites: Site[]
  onManage: (id: string) => void
  onAdd: () => void
}

function SiteList({ sites, onManage, onAdd }: Props) {
  if (sites.length === 0) {
    return (
      <div className="empty-state">
        <h2>No websites yet</h2>

        <p>
          Add your first site and start collecting
          comments.
        </p>

        <button
          className="btn btn-primary"
          onClick={onAdd}
        >
          + Add Website
        </button>
      </div>
    )
  }

  return (
    <div className="site-grid">
      {sites.map(site => (
        <div key={site.id} className="site-card">
          <div>
            <h3 className="site-name">
              {site.name}
            </h3>

            <p className="site-domain">
              {site.domain}
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onManage(site.id)}
          >
            Manage Site
          </button>
        </div>
      ))}
    </div>
  )
}

export default SiteList
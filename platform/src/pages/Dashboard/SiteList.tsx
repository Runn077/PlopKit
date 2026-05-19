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
        <p>No websites added yet</p>
        <button className="btn btn-primary" onClick={onAdd}>+ Add website</button>
      </div>
    )
  }

  return (
    <ul className="site-list">
      {sites.map(site => (
        <li key={site.id} className="site-row">
          <div>
            <div className="site-name">{site.name}</div>
            <div className="site-domain">{site.domain}</div>
          </div>
          <button className="btn" onClick={() => onManage(site.id)}>Manage</button>
        </li>
      ))}
    </ul>
  )
}

export default SiteList
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SiteList from './SiteList'
import AddSiteModal from './AddSiteModal'
import './Dashboard.css'

interface Site {
  id: string
  name: string
  domain: string
  siteKey: string
  createdAt: string
}

function Dashboard() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchSites() }, [])

  async function fetchSites() {
    const res = await fetch('http://localhost:3000/sites', { credentials: 'include' })
    const data = await res.json()
    setSites(data)
    setLoading(false)
  }

  async function handleAddSite(name: string, domain: string) {
    const res = await fetch('http://localhost:3000/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, domain }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    const site = await res.json()
    setSites(prev => [site, ...prev])
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Your websites</h2>
          {sites.length > 0 && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Add website
            </button>
          )}
        </div>
        <SiteList
          sites={sites}
          onManage={id => navigate(`/dashboard/sites/${id}`)}
          onAdd={() => setShowModal(true)}
        />
        {showModal && (
          <AddSiteModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAddSite}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard
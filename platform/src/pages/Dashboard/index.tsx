import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SiteList from './SiteList'
import AddSiteModal from './AddSiteModal'
import './Dashboard.css'
import type { Site } from '../../types'
import { apiFetch } from '../../lib/api'

function Dashboard() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { fetchSites() }, [])

  async function fetchSites() {
    try {
      setError('')
      const res = await apiFetch('/sites')
      if (!res.ok) throw new Error('Failed to load sites')
      const data = await res.json()
      setSites(data)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSite(name: string, domain: string) {
    const res = await apiFetch('/sites', {
      method: 'POST',
      body: JSON.stringify({ name, domain }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    const site = await res.json()
    setSites(prev => [site, ...prev])
  }

  if (loading) return <div className="page-loading">Loading...</div>

  if (error) return (
    <div>
      <Navbar />
      <div className="page-error">
        <p className="page-error-message">{error}</p>
        <button className="page-error-retry" onClick={fetchSites}>Try again</button>
      </div>
    </div>
  )

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
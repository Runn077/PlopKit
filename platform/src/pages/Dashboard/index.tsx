import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar/Navbar'
import SiteList from './SiteList'
import AddSiteModal from './modals/AddSiteModal'
import './Dashboard.css'
import type { Site } from '../../types'
import { apiFetch } from '../../lib/api'
import Footer from '../../components/layout/Footer/Footer'
import ImportSiteModal from './modals/ImportSiteModal'
import { Button } from '../../components/ui/Button/Button'
import { Modal } from '../../components/ui/Modal/Modal'

function Dashboard() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [testModal, setTestModal] = useState(false)

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

  async function handleImportSite(name: string, domain: string, data: any) {
    const res = await apiFetch('/sites/import', {
      method: 'POST',
      body: JSON.stringify({ name, domain, data }),
    })
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error ?? 'Import failed')
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
          <div className="dashboard-heading">
            <h1>Your Websites</h1>
            <p>Manage comments and widgets across your sites.</p>
          </div>

          {sites.length > 0 && (
          <div className="dashboard-header-actions">
            <Button variant="dark" onClick={() => setShowModal(true)}>
              + Add Website
            </Button>
            <Button variant="light" onClick={() => setShowImportModal(true)}>
              Import site
            </Button>
          </div>
          )}
        </div>

        <SiteList
          sites={sites}
          onManage={id => navigate(`/dashboard/sites/${id}`)}
          onAdd={() => setShowModal(true)}
          onImport={() => setShowImportModal(true)}
        />

        {showModal && (
          <AddSiteModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAddSite}
          />
        )}

        {showImportModal && (
          <ImportSiteModal
            onClose={() => setShowImportModal(false)}
            onSubmit={handleImportSite}
          />
        )}
      </div>
      <Footer />
    </div>
  )
}

export default Dashboard
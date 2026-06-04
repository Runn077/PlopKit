import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SubNav from '../../components/SubNav'
import WidgetList from './WidgetList'
import AddWidgetModal from './AddWidgetModal'
import SiteSettings from './settings/SiteSettings'
import './SiteWidgets.css'
import type { Site, Widget } from '../../types'
import { apiFetch } from '../../lib/api'

function SiteWidgets() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState<Site | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'widgets' | 'settings'>('widgets')

  useEffect(() => { fetchData() }, [siteId])

  async function fetchData() {
    try {
      setError('')
      const [siteRes, widgetsRes] = await Promise.all([
        apiFetch(`/sites/${siteId}`),
        apiFetch(`/widgets/${siteId}`),
      ])
      if (!siteRes.ok) throw new Error('Failed to load site')
      if (!widgetsRes.ok) throw new Error('Failed to load widgets')
      const siteData = await siteRes.json()
      const widgetsData = await widgetsRes.json()
      setSite(siteData)
      setWidgets(widgetsData)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddWidget(type: string, name: string) {
    const res = await apiFetch('/widgets', {
      method: 'POST',
      body: JSON.stringify({ siteId, type, name }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    const widget = await res.json()
    setWidgets(prev => [widget, ...prev])
  }

  async function handleSaveSite(name: string, domain: string) {
    const res = await apiFetch(`/sites/${siteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, domain }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    const updated = await res.json()
    setSite(updated)
  }

  async function handleDeleteSite() {
    const res = await apiFetch(`/sites/${siteId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    navigate('/dashboard')
  }

  async function handleDeleteWidget(widgetId: string) {
    const res = await apiFetch(`/widgets/${widgetId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
  }

  async function handleRenameWidget(widgetId: string, name: string) {
    const res = await apiFetch(`/widgets/${widgetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    const updated = await res.json()
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, name: updated.name } : w))
  }

  if (loading) return <div className="page-loading">Loading...</div>

  if (error) return (
    <div>
      <Navbar />
      <div className="page-error">
        <p className="page-error-message">{error}</p>
        <button className="page-error-retry" onClick={fetchData}>Try again</button>
      </div>
    </div>
  )

  return (
    <div>
      <Navbar />
      <SubNav
        tabs={[
          { id: 'widgets', label: 'Widgets' },
          { id: 'settings', label: 'Settings' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'widgets' | 'settings')}
      />
      {activeTab === 'widgets' && (
        <div>
          <div className="sw-breadcrumb">
            <span className="sw-breadcrumb-link" onClick={() => navigate('/dashboard')}>Sites</span>
            <span className="sw-breadcrumb-sep">/</span>
            <span className="sw-breadcrumb-current">{site!.name}</span>
          </div>
          <div className="sw-container">
            <div className="sw-site-card">
              <h1>{site!.name}</h1>
              <p>{site!.domain}</p>
            </div>
            <div className="sw-header">
              <h2 className="sw-title">Widgets</h2>
              <button className="sw-btn sw-btn-primary" onClick={() => setShowModal(true)}>
                + Add widget
              </button>
            </div>
            <WidgetList
              widgets={widgets}
              onOpen={(widget) => navigate(`/dashboard/sites/${siteId}/widgets/${widget.id}/comments`)}
            />
            {showModal && (
              <AddWidgetModal
                onClose={() => setShowModal(false)}
                onSubmit={handleAddWidget}
              />
            )}
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div style={{ paddingTop: 32 }}>
          <SiteSettings
            site={site!}
            widgets={widgets}
            onSave={handleSaveSite}
            onDelete={handleDeleteSite}
            onDeleteWidget={handleDeleteWidget}
            onOpenWidget={(widget) => navigate(`/dashboard/sites/${siteId}/widgets/${widget.id}/comments`)}
            onRenameWidget={handleRenameWidget}
          />
        </div>
      )}
    </div>
  )
}

export default SiteWidgets
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SubNav from './SubNav'
import WidgetList from './WidgetList'
import AddWidgetModal from './AddWidgetModal'
import SiteSettings from './settings/SiteSettings'
import './SiteWidgets.css'

interface Site {
  id: string
  name: string
  domain: string
  siteKey: string
}

interface Widget {
  id: string
  type: string
  name: string
  siteId: string
  createdAt: string
}

function SiteWidgets() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState<Site | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'widgets' | 'settings'>('widgets')

  useEffect(() => { fetchData() }, [siteId])

  async function fetchData() {
    const [siteRes, widgetsRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/sites/${siteId}`, { credentials: 'include' }),
      fetch(`${import.meta.env.VITE_API_URL}/widgets/${siteId}`, { credentials: 'include' }),
    ])
    const siteData = await siteRes.json()
    const widgetsData = await widgetsRes.json()
    setSite(siteData)
    setWidgets(widgetsData)
    setLoading(false)
  }

  async function handleAddWidget(type: string, name: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
    const res = await fetch(`${import.meta.env.VITE_API_URL}/sites/${siteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
    const res = await fetch(`${import.meta.env.VITE_API_URL}/sites/${siteId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    navigate('/dashboard')
  }

  async function handleDeleteWidget(widgetId: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/widgets/${widgetId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
  }

  if (loading) return <div>Loading...</div>
  if (!site) return <div>Site not found</div>

  return (
    <div>
      <Navbar />
      <SubNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'widgets' && (
        <div className="sw-container">
          <div className="sw-breadcrumb">
            <span className="sw-breadcrumb-link" onClick={() => navigate('/dashboard')}>Sites</span>
            <span className="sw-breadcrumb-sep">/</span>
            <span className="sw-breadcrumb-current">{site.name}</span>
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
      )}

      {activeTab === 'settings' && (
        <div style={{ paddingTop: 32 }}>
          <SiteSettings
            site={site}
            widgets={widgets}
            onSave={handleSaveSite}
            onDelete={handleDeleteSite}
            onDeleteWidget={handleDeleteWidget}
            onOpenWidget={(widget) => navigate(`/dashboard/sites/${siteId}/widgets/${widget.id}/comments`)}
          />
        </div>
      )}
    </div>
  )
}

export default SiteWidgets
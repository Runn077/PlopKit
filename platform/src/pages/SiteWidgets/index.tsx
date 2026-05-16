import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import WidgetList from './WidgetList'
import AddWidgetModal from './AddWidgetModal'
import './SiteWidgets.css'

interface Site {
  id: string
  name: string
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

  useEffect(() => { fetchData() }, [siteId])

  async function fetchData() {
    const [siteRes, widgetsRes] = await Promise.all([
      fetch(`http://localhost:3000/sites/${siteId}`, { credentials: 'include' }),
      fetch(`http://localhost:3000/widgets/${siteId}`, { credentials: 'include' }),
    ])
    const siteData = await siteRes.json()
    const widgetsData = await widgetsRes.json()
    setSite(siteData)
    setWidgets(widgetsData)
    setLoading(false)
  }

  async function handleAddWidget(type: string, name: string) {
    const res = await fetch('http://localhost:3000/widgets', {
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

  if (loading) return <div>Loading...</div>
  if (!site) return <div>Site not found</div>

  return (
    <div>
      <Navbar />
      <div className="sw-container">
        <button className="sw-back" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <div className="sw-header">
          <h2 className="sw-title">{site.name}</h2>
          <button className="sw-btn sw-btn-primary" onClick={() => setShowModal(true)}>
            + Add widget
          </button>
        </div>
        <WidgetList
          widgets={widgets}
          onOpen={(widget) => navigate(`/dashboard/sites/${siteId}/comments`)}
        />
        {showModal && (
          <AddWidgetModal
            onClose={() => setShowModal(false)}
            onSubmit={handleAddWidget}
          />
        )}
      </div>
    </div>
  )
}

export default SiteWidgets
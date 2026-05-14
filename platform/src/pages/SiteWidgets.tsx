import { useNavigate, useParams } from 'react-router-dom'
import { signOut } from '../lib/auth-client'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

interface Site {
  id: string
  name: string
  siteKey: string
}

function SiteWidgets() {
  const { siteId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState<Site | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSite()
  }, [siteId])

  async function fetchSite() {
    const res = await fetch(`http://localhost:3000/sites/${siteId}`, {
      credentials: 'include',
    })
    const data = await res.json()
    setSite(data)
    setLoading(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) return <div>Loading...</div>
  if (!site) return <div>Site not found</div>

  return (
    <div>
      < Navbar />

      <h2>{site.name}</h2>
      <p>Choose a widget to manage:</p>

      <div>
        <div onClick={() => navigate(`/dashboard/sites/${siteId}/comments`)}>
          <h3>Comments</h3>
          <p>Manage comments on your site</p>
        </div>
      </div>
    </div>
  )
}

export default SiteWidgets
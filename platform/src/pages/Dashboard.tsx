import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth-client'

interface Site {
  id: string
  name: string
  siteKey: string
  createdAt: string
}

function Dashboard() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [newSiteName, setNewSiteName] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchSites()
  }, [])

  async function fetchSites() {
    const res = await fetch('http://localhost:3000/sites', {
      credentials: 'include',
    })
    const data = await res.json()
    setSites(data)
    setLoading(false)
  }

  async function handleAddSite() {
    if (!newSiteName.trim()) return
    setAdding(true)

    const res = await fetch('http://localhost:3000/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newSiteName }),
    })

    const site = await res.json()
    setSites(prev => [site, ...prev])
    setNewSiteName('')
    setShowForm(false)
    setAdding(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <nav>
        <h1>PlopKit</h1>
        <button onClick={handleSignOut}>Sign out</button>
      </nav>

      <h2>Your Sites</h2>

      {sites.length === 0 && !showForm && (
        <div>
          <p>No sites yet.</p>
          <button onClick={() => setShowForm(true)}>Add your first site</button>
        </div>
      )}

      {showForm && (
        <div>
          <input
            type='text'
            placeholder='Site name'
            value={newSiteName}
            onChange={e => setNewSiteName(e.target.value)}
          />
          <button onClick={handleAddSite} disabled={adding}>
            {adding ? 'Adding...' : 'Add site'}
          </button>
          <button onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      {sites.length > 0 && (
        <>
          <button onClick={() => setShowForm(true)}>Add site</button>
          <ul>
            {sites.map(site => (
              <li key={site.id}>
                <span>{site.name}</span>
                <button onClick={() => navigate(`/dashboard/sites/${site.id}`)}>
                  Manage
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default Dashboard
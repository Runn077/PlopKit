import { useState } from 'react'
import { useSession, signOut } from '../../lib/auth-client'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { apiFetch } from '../../lib/api'
import './Account.css'

function Account() {
  const { data: session } = useSession()
  const navigate = useNavigate()
  const user = session?.user

  const [name, setName] = useState(user?.name ?? '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState('')

  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleSaveName() {
    if (!name.trim()) return
    setNameLoading(true)
    setNameError('')
    setNameSuccess('')
    try {
      const res = await apiFetch('/account/name', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      setNameSuccess('Name updated.')
    } catch (err: any) {
      setNameError(err.message)
    } finally {
      setNameLoading(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await apiFetch('/account', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      await signOut()
      navigate('/login')
    } catch (err: any) {
      setDeleteError(err.message)
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Navbar />
      <div className="account-container">
        <h2 className="account-title">Account settings</h2>

        <div className="account-section">
          <p className="account-section-title">Name</p>
          <div className="account-field">
            <label className="account-label">Display name</label>
            <input
              className="account-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          {nameError && <p className="account-error">{nameError}</p>}
          {nameSuccess && <p className="account-success">{nameSuccess}</p>}
          <button
            className="account-btn account-btn-primary"
            onClick={handleSaveName}
            disabled={nameLoading || !name.trim()}
          >
            {nameLoading ? 'Saving...' : 'Save name'}
          </button>
        </div>

        <div className="account-danger-zone">
          <div className="account-danger-row">
            <div>
              <p className="account-danger-text">Delete account</p>
              <p className="account-danger-hint">Permanently delete your account and all your data.</p>
            </div>
            {!confirmDelete ? (
              <button
                className="account-btn account-btn-danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete account
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="account-btn"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  className="account-btn account-btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Confirm delete'}
                </button>
              </div>
            )}
          </div>
          {deleteError && <p className="account-error" style={{ marginTop: 12 }}>{deleteError}</p>}
        </div>
      </div>
    </div>
  )
}

export default Account
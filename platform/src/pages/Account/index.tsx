import { useState, useEffect } from 'react'
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

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [hasPassword, setHasPassword] = useState(false)

  useEffect(() => {
    apiFetch('/account/me')
      .then(r => r.json())
      .then(d => setHasPassword(d.hasPassword))
  }, [])

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

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) return
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')
    try {
      const res = await apiFetch('/account/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      setPasswordSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
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

        {hasPassword && (
          <div className="account-section">
            <p className="account-section-title">Change password</p>
            <div className="account-field">
              <label className="account-label">Current password</label>
              <input
                className="account-input"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="account-field">
              <label className="account-label">New password</label>
              <input
                className="account-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {passwordError && <p className="account-error">{passwordError}</p>}
            {passwordSuccess && <p className="account-success">{passwordSuccess}</p>}
            <button
              className="account-btn account-btn-primary"
              onClick={handleChangePassword}
              disabled={passwordLoading || !currentPassword || !newPassword}
            >
              {passwordLoading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        )}

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
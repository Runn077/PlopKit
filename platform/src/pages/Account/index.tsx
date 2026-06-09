import { useState, useEffect } from 'react'
import { useSession, signOut } from '../../lib/auth-client'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { apiFetch } from '../../lib/api'
import './Account.css'
import UpgradeModal from './UpgradeModal'
import DeleteAccountModal from './DeleteAccountModal'

type Usage = {
  plan: 'free' | 'hobby' | 'pro'
  pendingPlan: 'free' | 'hobby' | 'pro' | null
  monthlyLoads: number
  limit: number
}

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
  const [usage, setUsage] = useState<Usage | null>(null)
  const [usageLoading, setUsageLoading] = useState(true)
  const [usageError, setUsageError] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const upgradeStatus = searchParams.get('upgrade')

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await apiFetch('/account/usage')
        if (!res.ok) throw new Error('Failed to load usage')
        const data = await res.json()
        setUsage(data)
      } catch (err: any) {
        setUsageError(err.message)
      } finally {
        setUsageLoading(false)
      }
    }
    fetchUsage()
  }, [])

  useEffect(() => {
    if (upgradeStatus) {
      setSearchParams({}, { replace: true })
    }
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

  async function handleManageBilling() {
    try {
      const res = await apiFetch('/billing/portal', { method: 'POST' })
      if (!res.ok) throw new Error('Something went wrong')
      const { url } = await res.json()
      window.location.href = url
    } catch (err: any) {
      console.error(err)
    }
  }

  async function handlePlanChanged() {
    const res = await apiFetch('/account/usage')
    if (res.ok) {
      const data = await res.json()
      setUsage(data)
    }
  }

  const usagePercent = usage ? Math.min((usage.monthlyLoads / usage.limit) * 100, 100) : 0

  return (
    <div>
      <Navbar />
      <div className="account-container">
        {upgradeStatus === 'success' && (
          <p className="account-success">Plan upgraded successfully.</p>
        )}
        {upgradeStatus === 'cancelled' && (
          <p className="account-error">Upgrade cancelled.</p>
        )}
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

        <div className="account-section">
          <p className="account-section-title">Plan & usage</p>
          {usageLoading && <p className="account-label">Loading...</p>}
          {usageError && <p className="account-error">{usageError}</p>}
          {usage && (
            <>
              <div className="account-plan-badge">{usage.plan}</div>
              <div className="account-usage-bar-track">
                <div
                  className="account-usage-bar-fill"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="account-label">
                {usage.monthlyLoads.toLocaleString()} of {usage.limit.toLocaleString()} loads used this month
              </p>
              <button
                className="account-btn account-btn-primary"
                onClick={() => setShowUpgradeModal(true)}
              >
                Upgrade plan
              </button>
            </>
          )}
        </div>

        {showUpgradeModal && usage && (
          <UpgradeModal
            currentPlan={usage.plan}
            pendingPlan={usage.pendingPlan}
            onClose={() => setShowUpgradeModal(false)}
            onPlanChanged={handlePlanChanged}
          />
        )}

        {usage && usage.plan !== 'free' && (
          <button
            className="account-btn"
            onClick={handleManageBilling}
          >
            Manage billing
          </button>
        )}

        <div className="account-danger-zone">
          <div className="account-danger-row">
            <div>
              <p className="account-danger-text">Delete account</p>
              <p className="account-danger-hint">Permanently delete your account and all your data.</p>
            </div>
            <button
              className="account-btn account-btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete account
            </button>
          </div>
        </div>

        {showDeleteModal && user && (
          <DeleteAccountModal
            userEmail={user.email}
            onConfirm={handleDeleteAccount}
            onClose={() => setShowDeleteModal(false)}
            loading={deleteLoading}
            error={deleteError}
          />
        )}
      </div>
    </div>
  )
}

export default Account
import { useState } from 'react'
import { apiFetch } from '../../lib/api'
import './UpgradeModal.css'

type Plan = 'free' | 'hobby' | 'pro'

type Props = {
  currentPlan: Plan
  pendingPlan: Plan | null
  onClose: () => void
  onPlanChanged: () => void
}

const PLANS = [
  { key: 'free' as Plan, name: 'Free', price: '$0', loads: '5,000' },
  { key: 'hobby' as Plan, name: 'Hobby', price: '$5/mo', loads: '150,000' },
  { key: 'pro' as Plan, name: 'Pro', price: '$12/mo', loads: '500,000' },
]

const PLAN_RANK: Record<Plan, number> = { free: 0, hobby: 1, pro: 2 }

function UpgradeModal({ currentPlan, pendingPlan, onClose, onPlanChanged }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmUpgrade, setConfirmUpgrade] = useState<Plan | null>(null)

  async function handleCheckout(plan: Plan) {
    setLoading(plan)
    setError('')
    try {
      const res = await apiFetch('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      const { url } = await res.json()
      window.location.href = url
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  async function handleUpgrade(plan: Plan) {
    setLoading(plan)
    setError('')
    try {
      const res = await apiFetch('/billing/upgrade', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      onPlanChanged()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  async function handleDowngrade(plan: Plan) {
    setLoading(plan)
    setError('')
    try {
      const res = await apiFetch('/billing/downgrade', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      onPlanChanged()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  async function handleCancelDowngrade() {
    setLoading('cancel-downgrade')
    setError('')
    try {
      const res = await apiFetch('/billing/cancel-downgrade', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Something went wrong')
      }
      onPlanChanged()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="pk-modal-overlay" onClick={onClose}>
      <div className="pk-modal pk-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="pk-modal-header">
          <p className="pk-modal-title">Manage your plan</p>
          <button type="button" className="pk-modal-close" onClick={onClose}>✕</button>
        </div>

        {confirmUpgrade && (
          <div className="pk-modal-overlay pk-modal-overlay-nested">
            <div className="pk-modal">
              <p className="pk-modal-title">Upgrade to {confirmUpgrade}?</p>
              <p className="pk-modal-body">
                Your subscription will be upgraded immediately.
              </p>
              <p className="pk-modal-body">
                Stripe will charge the payment method currently associated
                with your account for any prorated amount due.
              </p>
              <div className="pk-modal-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setConfirmUpgrade(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleUpgrade(confirmUpgrade)}
                  disabled={loading !== null}
                >
                  {loading === confirmUpgrade ? 'Upgrading...' : 'Confirm Upgrade'}
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingPlan && (
          <div className="upgrade-pending-notice">
            <p>You have a pending downgrade to <strong>{pendingPlan}</strong> at the end of your billing period.</p>
            <button
              className="upgrade-card-btn-secondary"
              onClick={handleCancelDowngrade}
              disabled={loading !== null}
            >
              {loading === 'cancel-downgrade' ? 'Cancelling...' : 'Cancel downgrade'}
            </button>
          </div>
        )}

        <div className="upgrade-cards">
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan
            const isPending = plan.key === pendingPlan
            const isUpgrade = PLAN_RANK[plan.key] > PLAN_RANK[currentPlan]
            const isDowngrade = PLAN_RANK[plan.key] < PLAN_RANK[currentPlan] && plan.key !== 'free'

            return (
              <div
                key={plan.key}
                className={`upgrade-card ${isCurrent ? 'upgrade-card-current' : ''} ${isPending ? 'upgrade-card-pending' : ''}`}
              >
                <p className="upgrade-card-name">{plan.name}</p>
                <p className="upgrade-card-price">{plan.price}</p>
                <p className="upgrade-card-loads">{plan.loads} loads/mo</p>

                {isCurrent && <p className="upgrade-card-current-label">Current plan</p>}
                {isPending && <p className="upgrade-card-current-label">Pending at renewal</p>}

                {isUpgrade && !pendingPlan && (
                  <button
                    className="upgrade-card-btn"
                    onClick={() =>
                      currentPlan === 'free'
                        ? handleCheckout(plan.key)
                        : setConfirmUpgrade(plan.key)
                    }
                    disabled={loading !== null}
                  >
                    {loading === plan.key ? 'Processing...' : `Upgrade to ${plan.name}`}
                  </button>
                )}

                {isDowngrade && !pendingPlan && (
                  <button
                    className="upgrade-card-btn-secondary"
                    onClick={() => handleDowngrade(plan.key)}
                    disabled={loading !== null}
                  >
                    {loading === plan.key ? 'Processing...' : `Downgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {error && <p className="upgrade-error">{error}</p>}
      </div>
    </div>
  )
}

export default UpgradeModal
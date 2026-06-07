import { useState } from 'react'
import { apiFetch } from '../../lib/api'
import './UpgradeModal.css'

type Plan = 'free' | 'hobby' | 'pro'

type Props = {
  currentPlan: Plan
  onClose: () => void
}

const PLANS = [
  { key: 'free' as Plan, name: 'Free', price: '$0', loads: '10,000' },
  { key: 'hobby' as Plan, name: 'Hobby', price: '$5/mo', loads: '150,000' },
  { key: 'pro' as Plan, name: 'Pro', price: '$12/mo', loads: '500,000' },
]

const PLAN_RANK: Record<Plan, number> = { free: 0, hobby: 1, pro: 2 }

function UpgradeModal({ currentPlan, onClose }: Props) {
  const [loading, setLoading] = useState<Plan | null>(null)
  const [error, setError] = useState('')

  async function handleChoose(plan: Plan) {
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

  return (
    <div className="upgrade-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        <div className="upgrade-modal-header">
          <p className="upgrade-modal-title">Upgrade your plan</p>
          <button className="upgrade-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="upgrade-cards">
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan
            const isUpgrade = PLAN_RANK[plan.key] > PLAN_RANK[currentPlan]
            return (
              <div
                key={plan.key}
                className={`upgrade-card ${isCurrent ? 'upgrade-card-current' : ''}`}
              >
                <p className="upgrade-card-name">{plan.name}</p>
                <p className="upgrade-card-price">{plan.price}</p>
                <p className="upgrade-card-loads">{plan.loads} loads/mo</p>
                {isCurrent && (
                  <p className="upgrade-card-current-label">Current plan</p>
                )}
                {isUpgrade && (
                  <button
                    className="upgrade-card-btn"
                    onClick={() => handleChoose(plan.key)}
                    disabled={loading !== null}
                  >
                    {loading === plan.key ? 'Redirecting...' : `Choose ${plan.name}`}
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
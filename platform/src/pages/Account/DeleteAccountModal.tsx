import { useState } from 'react'

type Props = {
  userEmail: string
  onConfirm: () => void
  onClose: () => void
  loading: boolean
  error: string
}

function DeleteAccountModal({ userEmail, onConfirm, onClose, loading, error }: Props) {
  const [emailInput, setEmailInput] = useState('')
  const emailMatches = emailInput === userEmail

  return (
    <div className="pk-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pk-modal" onClick={e => e.stopPropagation()}>
        <p className="pk-modal-title">Delete account</p>
        <p className="pk-modal-body">
          If you delete this account, <strong>all your sites, widgets, and data will be permanently deleted.</strong> This action cannot be undone.
        </p>
        <div className="pk-modal-form">
          <div className="pk-modal-field">
            <label className="pk-modal-label">Enter your email to confirm</label>
            <input
              className="pk-modal-input"
              type="email"
              placeholder={userEmail}
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
            />
          </div>
          {error && <p className="pk-modal-error">{error}</p>}
          <div className="pk-modal-actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              disabled={!emailMatches || loading}
            >
              {loading ? 'Deleting...' : 'Confirm delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal

import { useState } from 'react'
import './DeleteAccountModal.css'

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
    <div className="delete-modal-overlay" onClick={onClose}>
      <div className="delete-modal" onClick={e => e.stopPropagation()}>
        <h2 className="delete-modal-title">Delete account</h2>
        <p className="delete-modal-body">
          If you delete this account, <strong>all your sites, widgets, and data will be permanently deleted.</strong> This action cannot be undone.
        </p>
        <div className="delete-modal-field">
          <label className="delete-modal-label">Enter your email to confirm</label>
          <input
            className="delete-modal-input"
            type="email"
            placeholder={userEmail}
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
          />
        </div>
        {error && <p className="delete-modal-error">{error}</p>}
        <div className="delete-modal-actions">
          <button className="delete-modal-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="delete-modal-btn delete-modal-btn-danger"
            onClick={onConfirm}
            disabled={!emailMatches || loading}
          >
            {loading ? 'Deleting...' : 'Confirm delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteAccountModal
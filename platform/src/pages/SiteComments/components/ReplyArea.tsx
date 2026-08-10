interface Props {
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
  loading: boolean
}

function ReplyArea({ value, onChange, onCancel, onSubmit, loading }: Props) {
  return (
    <div className="sc-reply-input">
      <textarea
        className="sc-reply-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Reply as site owner..."
        maxLength={2500}
        autoFocus
      />
      <div className="sc-reply-input-actions">
        <span className="sc-char-count">{value.length}/2500</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="sc-btn-cancel-text" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="sc-btn-post-reply"
            onClick={onSubmit}
            disabled={loading || !value.trim()}
          >
            {loading ? 'Posting...' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReplyArea
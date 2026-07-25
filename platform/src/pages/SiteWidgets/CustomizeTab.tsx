import { useState } from 'react'
import { THEME_TOKENS, THEME_GROUPS, type ThemeTokens } from '../../lib/themeTokens'
import './CustomizeTab.css'

interface Props {
  theme: { tokens: ThemeTokens } | null
  onSave: (tokens: ThemeTokens) => Promise<void>
}

function CustomizeTab({ theme: initialTheme, onSave }: Props) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTheme?.tokens ?? {})
  const [openGroup, setOpenGroup] = useState<string | null>(THEME_GROUPS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleChange(key: string, value: string) {
    setTokens(prev => ({ ...prev, [key]: value || undefined }))
  }

  function handleReset(key: string) {
    setTokens(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await onSave(tokens)
      setSuccess('Theme saved.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ct-layout">
      <div className="ct-preview">
        <div
          className="ct-mock-widget"
          style={{
            fontFamily: tokens.fontFamily || undefined,
            color: tokens.colorText || undefined,
          }}
        >
          <h3 className="ct-mock-heading">2 Comments</h3>

          <div
            className="ct-mock-input-area"
            style={{
              background: tokens.inputBg || undefined,
              border: `1px solid ${tokens.inputBorder || '#ccc'}`,
              borderRadius: tokens.radius || undefined,
            }}
          >
            <div className="ct-mock-name-input" style={{ color: tokens.inputTextColor || undefined }}>
              Name (optional)
            </div>
            <div className="ct-mock-textarea" style={{ color: tokens.inputTextColor || undefined }}>
              Add a comment...
            </div>
            <button
              className="ct-mock-post-btn"
              style={{
                background: tokens.btnPostBg || undefined,
                color: tokens.btnPostText || undefined,
              }}
            >
              Post
            </button>
          </div>

          <div
            className="ct-mock-card"
            style={{
              background: tokens.cardBg || undefined,
              color: tokens.cardTextColor || undefined,
              borderTop: `1px solid ${tokens.dividerColor || '#f0f0f0'}`,
            }}
          >
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <span className="ct-mock-badge" style={{ background: tokens.badgeOwner || '#4ecdc4' }}>Owner</span>
              <span className="ct-mock-badge" style={{ background: tokens.badgePinned || '#999' }}>Pinned</span>
            </div>
            <strong style={{ fontFamily: tokens.fontFamily || undefined }}>Jane Doe</strong>
            <p
              className="ct-mock-body"
              style={{ fontFamily: tokens.fontFamilyBody || tokens.fontFamily || undefined }}
            >
              This is what a comment looks like with your current theme.
            </p>
            <button className="ct-mock-link-btn" style={{ color: tokens.colorDanger || '#ff4444' }}>
              Delete
            </button>

            <div
              className="ct-mock-reply"
              style={{ background: tokens.replyBg || undefined, color: tokens.replyTextColor || undefined }}
            >
              <div
                className="ct-mock-quoted"
                style={{ borderLeftColor: tokens.quoteAccent || '#ffe66d' }}
              >
                Quoted reply text
              </div>
              <strong style={{ fontFamily: tokens.fontFamily || undefined }}>John Smith</strong>
              <p style={{ fontFamily: tokens.fontFamilyBody || tokens.fontFamily || undefined }}>
                And this is a reply to that comment.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="ct-controls">
        {THEME_GROUPS.map(group => (
          <div key={group} className="ct-group">
            <button
              className="ct-group-header"
              onClick={() => setOpenGroup(prev => prev === group ? null : group)}
            >
              <span>{group}</span>
              <span className="ct-group-chevron">{openGroup === group ? '−' : '+'}</span>
            </button>
            {openGroup === group && (
              <div className="ct-group-body">
                {THEME_TOKENS.filter(t => t.group === group).map(token => (
                  <div key={token.key} className="ct-field-row">
                    <label className="ct-field-label">{token.label}</label>
                    <div className="ct-field-control">
                      {token.type === 'color' ? (
                        <input
                          type="color"
                          className="ct-color-input"
                          value={tokens[token.key] && tokens[token.key] !== 'transparent' ? tokens[token.key] : '#ffffff'}
                          onChange={e => handleChange(token.key, e.target.value)}
                        />
                      ) : (
                        <input
                          type="text"
                          className="ct-text-input"
                          placeholder={token.default}
                          value={tokens[token.key] ?? ''}
                          onChange={e => handleChange(token.key, e.target.value)}
                        />
                      )}
                      {tokens[token.key] && (
                        <button className="ct-reset-btn" onClick={() => handleReset(token.key)}>
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {error && <p style={{ fontSize: 12, color: 'red', marginTop: 8 }}>{error}</p>}
        {success && <p style={{ fontSize: 12, color: '#000', marginTop: 8 }}>{success}</p>}

        <button className="sc-btn" onClick={handleSave} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'Saving...' : 'Save theme'}
        </button>
      </div>
    </div>
  )
}

export default CustomizeTab
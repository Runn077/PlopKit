import { useState } from 'react'
import { THEME_TOKENS, THEME_GROUPS } from '../../lib/themeTokens'
import type { ThemeTokens } from '../../types'
import WidgetMockup from './WidgetMockup'
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
        <WidgetMockup tokens={tokens} />
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

        {error && <p className="ct-error">{error}</p>}
        {success && <p className="ct-success">{success}</p>}

        <button className="sc-btn" onClick={handleSave} disabled={saving} style={{ marginTop: 16 }}>
          {saving ? 'Saving...' : 'Save theme'}
        </button>
      </div>
    </div>
  )
}

export default CustomizeTab
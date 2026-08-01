import { useState } from 'react'
import { THEME_TOKENS, THEME_GROUPS } from '../../lib/themeTokens'
import type { ThemeTokens } from '../../types'
import { useThemePreview } from '../../hooks/useThemePreview'
import ThemeFieldControl from '../../components/ui/ThemeFieldControl/ThemeFieldControl'
import './CustomizeTab.css'

interface Props {
  theme: { tokens: ThemeTokens } | null
  onSave: (tokens: ThemeTokens) => Promise<void>
}

const RADIUS_KEYS = ['inputRadius', 'cardRadius', 'replyRadius', 'widgetRadius', 'toastRadius', 'btnPostRadius']
const SPACING_KEYS = ['widgetPadding', 'inputAreaPadding', 'cardPadding', 'replyPadding']

function CustomizeTab({ theme: initialTheme, onSave }: Props) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTheme?.tokens ?? {})
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set([THEME_GROUPS[0]]))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const previewRef = useThemePreview(tokens)

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

  function toggleGroup(group: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
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
        <div ref={previewRef} />
      </div>

      <div className="ct-controls">
        {THEME_GROUPS.map(group => (
          <div key={group} className="ct-group">
            <button className="ct-group-header" onClick={() => toggleGroup(group)}>
              <span>{group}</span>
              <span className="ct-group-chevron">{openGroups.has(group) ? '−' : '+'}</span>
            </button>
            {openGroups.has(group) && (
              <div className="ct-group-body">
                {THEME_TOKENS.filter(t => t.group === group).map(token => (
                  <div key={token.key} className="ct-field-row">
                    <label className="ct-field-label">{token.label}</label>
                    <div className="ct-field-control">
                      <ThemeFieldControl
                        token={token}
                        value={tokens[token.key]}
                        onChange={handleChange}
                        isClamped={RADIUS_KEYS.includes(token.key) || SPACING_KEYS.includes(token.key)}
                      />
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
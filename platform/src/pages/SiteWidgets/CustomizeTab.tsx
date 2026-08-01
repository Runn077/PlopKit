import { useState, useEffect, useRef } from 'react'
import { THEME_TOKENS, THEME_GROUPS } from '../../lib/themeTokens'
import type { ThemeTokens } from '../../types'
import './CustomizeTab.css'
import FontPicker from '../../components/ui/FontPicker/FontPicker'

interface Props {
  theme: { tokens: ThemeTokens } | null
  onSave: (tokens: ThemeTokens) => Promise<void>
}

const PREVIEW_WIDGET_KEY = 'preview-key'
const PREVIEW_INSTANCE_ID = `plopkit-${PREVIEW_WIDGET_KEY}`

function cssVarName(key: string) {
  return '--pkw-' + key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function CustomizeTab({ theme: initialTheme, onSave }: Props) {
  const [tokens, setTokens] = useState<ThemeTokens>(initialTheme?.tokens ?? {})
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set([THEME_GROUPS[0]]))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const RADIUS_KEYS = ['inputRadius', 'cardRadius', 'replyRadius', 'widgetRadius', 'toastRadius', 'btnPostRadius']
  const SPACING_KEYS = ['widgetPadding', 'inputAreaPadding', 'cardPadding', 'replyPadding']

  const previewRef = useRef<HTMLDivElement>(null)
  const [hostReady, setHostReady] = useState(false)

  useEffect(() => {
    if (!previewRef.current) return
    if (document.getElementById(PREVIEW_INSTANCE_ID)) return

    const script = document.createElement('script')
    script.src = '/widget.js'
    script.setAttribute('data-widget-key', PREVIEW_WIDGET_KEY)
    script.setAttribute('data-preview', 'true')
    previewRef.current.appendChild(script)

    const observer = new MutationObserver(() => {
      if (document.getElementById(PREVIEW_INSTANCE_ID)) {
        setHostReady(true)
        observer.disconnect()
      }
    })
    observer.observe(previewRef.current, { childList: true })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!hostReady) return
    const host = document.getElementById(PREVIEW_INSTANCE_ID)
    if (!host) return
    for (const token of THEME_TOKENS) {
      const value = tokens[token.key]
      if (value) {
        host.style.setProperty(cssVarName(token.key), value)
      } else {
        host.style.removeProperty(cssVarName(token.key))
      }
    }
  }, [tokens, hostReady])

  useEffect(() => {
    if (!previewRef.current) return
    if (document.getElementById(PREVIEW_INSTANCE_ID)) return

    const script = document.createElement('script')
    script.src = '/widget.js'
    script.setAttribute('data-widget-key', PREVIEW_WIDGET_KEY)
    script.setAttribute('data-preview', 'true')
    previewRef.current.appendChild(script)
  }, [])

  useEffect(() => {
    const host = document.getElementById(PREVIEW_INSTANCE_ID)
    if (!host) return
    for (const token of THEME_TOKENS) {
      const value = tokens[token.key]
      if (value) {
        host.style.setProperty(cssVarName(token.key), value)
      } else {
        host.style.removeProperty(cssVarName(token.key))
      }
    }
  }, [tokens])

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
      if (next.has(group)) {
        next.delete(group)
      } else {
        next.add(group)
      }
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
            <button
              className="ct-group-header"
              onClick={() => toggleGroup(group)}
            >
              <span>{group}</span>
              <span className="ct-group-chevron">{openGroups.has(group) ? '−' : '+'}</span>
            </button>
            {openGroups.has(group) && (
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
                      ) : token.type === 'font' ? (
                        <FontPicker
                          value={tokens[token.key] ?? ''}
                          onChange={value => handleChange(token.key, value)}
                        />
                      ) : RADIUS_KEYS.includes(token.key) || SPACING_KEYS.includes(token.key) ? (
                        <div className="ct-stepper">
                          <button
                            type="button"
                            className="ct-stepper-btn"
                            onClick={() => {
                              const current = parseFloat(tokens[token.key] ?? '0') || 0
                              handleChange(token.key, `${Math.max(0, current - 1)}px`)
                            }}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="ct-stepper-input"
                            value={parseFloat(tokens[token.key] ?? '0') || 0}
                            step={1}
                            min={0}
                            onChange={e => {
                              const n = parseFloat(e.target.value)
                              if (isNaN(n)) return
                              handleChange(token.key, `${Math.max(0, n)}px`)
                            }}
                          />
                          <button
                            type="button"
                            className="ct-stepper-btn"
                            onClick={() => {
                              const current = parseFloat(tokens[token.key] ?? '0') || 0
                              handleChange(token.key, `${current + 1}px`)
                            }}
                          >
                            +
                          </button>
                        </div>
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
import type { ThemeTokenDef } from '../../../lib/themeTokens'

import FontPicker from '../../ui/FontPicker/FontPicker'

interface Props {
  token: ThemeTokenDef
  value: string | undefined
  onChange: (key: string, value: string) => void
  isClamped: boolean
}

function ThemeFieldControl({ token, value, onChange, isClamped }: Props) {
  if (token.type === 'color') {
    return (
      <input
        type="color"
        className="ct-color-input"
        value={value && value !== 'transparent' ? value : '#ffffff'}
        onChange={e => onChange(token.key, e.target.value)}
      />
    )
  }

  if (token.type === 'font') {
    return <FontPicker value={value ?? ''} onChange={v => onChange(token.key, v)} />
  }

  if (isClamped) {
    const current = parseFloat(value ?? '0') || 0
    return (
      <div className="ct-stepper">
        <button
          type="button"
          className="ct-stepper-btn"
          onClick={() => onChange(token.key, `${Math.max(token.min ?? 0, current - 1)}px`)}
        >
          −
        </button>
        <input
          type="number"
          className="ct-stepper-input"
          value={current}
          step={1}
          min={token.min ?? 0}
          max={token.max}
          onChange={e => {
            const n = parseFloat(e.target.value)
            if (isNaN(n)) return
            const clamped = Math.min(token.max ?? Infinity, Math.max(token.min ?? 0, n))
            onChange(token.key, `${clamped}px`)
          }}
        />
        <button
          type="button"
          className="ct-stepper-btn"
          onClick={() => onChange(token.key, `${Math.min(token.max ?? Infinity, current + 1)}px`)}
        >
          +
        </button>
      </div>
    )
  }

  return (
    <input
      type="text"
      className="ct-text-input"
      placeholder={token.default}
      value={value ?? ''}
      onChange={e => onChange(token.key, e.target.value)}
    />
  )
}

export default ThemeFieldControl
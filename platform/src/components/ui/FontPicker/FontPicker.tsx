import { useState, useRef, useEffect, useMemo } from 'react'
import { FONT_OPTIONS, type FontOption } from '../../../lib/fontOptions'
import styles from './FontPicker.module.css'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function FontPicker({ value, onChange, placeholder = 'Search fonts...' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selected = FONT_OPTIONS.find(f => f.value === value)

  const sortedFonts = useMemo(
    () => [...FONT_OPTIONS].sort((a, b) => a.label.localeCompare(b.label)),
    []
  )

  const filteredFonts = useMemo(
    () => sortedFonts.filter(f => f.label.toLowerCase().includes(query.toLowerCase())),
    [sortedFonts, query]
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(font: FontOption) {
    onChange(font.value)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(prev => !prev)}
        style={{ fontFamily: selected?.value }}
      >
        {selected?.label ?? 'Default'}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          <div className={styles.optionsList}>
            {filteredFonts.length === 0 && (
              <div className={styles.noResults}>No fonts found</div>
            )}
            {filteredFonts.map(font => (
              <button
                type="button"
                key={font.value}
                className={styles.option}
                style={{ fontFamily: font.value }}
                onClick={() => handleSelect(font)}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FontPicker
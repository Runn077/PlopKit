import { useState } from 'react'
import './WordFilterTab.css'

interface Props {
  bannedWords: string[]
  autoDelete: boolean
  onSave: (bannedWords: string[], autoDelete: boolean) => Promise<void>
}

function WordFilterTab({ bannedWords: initialWords, autoDelete: initialAutoDelete, onSave }: Props) {
  const [words, setWords] = useState<string[]>(initialWords)
  const [autoDelete, setAutoDelete] = useState(initialAutoDelete)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function handleAdd() {
    const trimmed = input.trim().toLowerCase()
    if (!trimmed) return
    if (words.includes(trimmed)) {
      setInput('')
      return
    }
    setWords(prev => [...prev, trimmed])
    setInput('')
  }

  function handleRemove(word: string) {
    setWords(prev => prev.filter(w => w !== word))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await onSave(words, autoDelete)
      setSuccess('Word filter saved.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="switch">
        <div className="switch-label">
          <span>Auto reject flagged comments</span>
          <span className="switch-hint">Reject comments containing banned words instead of censoring</span>
        </div>
        <button
          className={`toggle ${autoDelete ? 'toggle-on' : ''}`}
          onClick={() => setAutoDelete(v => !v)}
        >
          <span className="toggle-knob" />
        </button>
      </div>

      <div className="sw-filter-input-row">
        <input
          className="input"
          placeholder="Add a word..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
        />
        <button className="btn-light" onClick={handleAdd} disabled={!input.trim()}>
          Add
        </button>
      </div>

      {words.length > 0 ? (
        <div className="sw-filter-tags">
          {words.map(word => (
            <div key={word} className="sw-filter-tag">
              <span>{word}</span>
              <button
                className="sw-filter-tag-remove"
                onClick={() => handleRemove(word)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="sc-empty">No banned words yet.</p>
      )}

      {error && <p className="sw-error">{error}</p>}
      {success && <p className="sw-success">{success}</p>}
      
      <button
        className="btn"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save filter'}
      </button>
    </div>
  )
}

export default WordFilterTab
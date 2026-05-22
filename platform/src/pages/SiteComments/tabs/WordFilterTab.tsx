import { useState } from 'react'
import '../SiteComments.css'

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
      <div className="sc-auto-approve">
        <div className="sc-auto-approve-label">
          <span>Auto-delete flagged comments</span>
          <span className="sc-auto-approve-hint">Delete comments containing banned words instead of censoring</span>
        </div>
        <button
          className={`sc-toggle ${autoDelete ? 'sc-toggle-on' : ''}`}
          onClick={() => setAutoDelete(v => !v)}
        >
          <span className="sc-toggle-knob" />
        </button>
      </div>

      <div className="sc-filter-input-row">
        <input
          className="sc-filter-input"
          placeholder="Add a word..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="sc-btn" onClick={handleAdd} disabled={!input.trim()}>
          Add
        </button>
      </div>

      {words.length > 0 ? (
        <div className="sc-filter-tags">
          {words.map(word => (
            <span key={word} className="sc-filter-tag">
              {word}
              <button className="sc-filter-tag-remove" onClick={() => handleRemove(word)}>×</button>
            </span>
          ))}
        </div>
      ) : (
        <p className="sc-empty">No banned words yet.</p>
      )}

      {error && <p style={{ fontSize: 12, color: 'red', marginTop: 8 }}>{error}</p>}
      {success && <p style={{ fontSize: 12, color: '#000', marginTop: 8 }}>{success}</p>}

      <button
        className="sc-btn"
        onClick={handleSave}
        disabled={saving}
        style={{ marginTop: 16 }}
      >
        {saving ? 'Saving...' : 'Save filter'}
      </button>
    </div>
  )
}

export default WordFilterTab
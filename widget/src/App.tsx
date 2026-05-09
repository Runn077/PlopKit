import { useEffect, useState } from 'react'

interface Comment {
  id: string
  body: string
  createdAt: string
}

interface Props {
  siteKey: string
  pageUrl: string
}

export default function App({ siteKey, pageUrl }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')

  useEffect(() => {
    fetch(`http://localhost:3000/comments?site_key=${siteKey}&page_url=${encodeURIComponent(pageUrl)}`)
      .then(res => res.json())
      .then(setComments)
  }, [])

  const post = async () => {
    if (!body.trim()) return
    const comment = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_key: siteKey, page_url: pageUrl, body }),
    }).then(res => res.json())

    setComments([comment, ...comments])
    setBody('')
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '2rem auto' }}>
      <h3 style={{ marginBottom: '1rem' }}>Comments</h3>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        maxLength={280}
        placeholder="Write a comment..."
        style={{ width: '100%', height: '80px', padding: '8px', boxSizing: 'border-box' }}
      />
      <div style={{ fontSize: '12px', color: '#999', textAlign: 'right' }}>{body.length}/280</div>
      <button onClick={post} style={{ marginTop: '8px', padding: '8px 16px' }}>Post</button>

      <div style={{ marginTop: '1.5rem' }}>
        {comments.length === 0 && <p style={{ color: '#999' }}>No comments yet. Be the first!</p>}
        {comments.map(c => (
          <div key={c.id} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
            <p style={{ margin: 0 }}>{c.body}</p>
            <span style={{ fontSize: '12px', color: '#999' }}>{new Date(c.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
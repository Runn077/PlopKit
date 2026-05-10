import { useEffect, useState } from 'react'

interface Reply {
  id: string
  body: string
  createdAt: string
}

interface Comment {
  id: string
  body: string
  createdAt: string
  replies: Reply[]
}

interface Props {
  siteKey: string
  pageUrl: string
}

export default function Comments({ siteKey, pageUrl }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [body, setBody] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')

  useEffect(() => {
    fetch(`http://localhost:3000/comments?site_key=${siteKey}&page_url=${encodeURIComponent(pageUrl)}`)
      .then(res => res.json())
      .then(setComments)
  }, [])

  const postComment = async () => {
    if (!body.trim()) return
    const comment = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_key: siteKey, page_url: pageUrl, body }),
    }).then(res => res.json())

    setComments([{ ...comment, replies: [] }, ...comments])
    setBody('')
  }

  const postReply = async (parentId: string) => {
    if (!replyBody.trim()) return
    const reply = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_key: siteKey, page_url: pageUrl, body: replyBody, parent_id: parentId }),
    }).then(res => res.json())

    setComments(comments.map(c =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
    ))
    setReplyingTo(null)
    setReplyBody('')
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
      <button onClick={postComment} style={{ marginTop: '8px', padding: '8px 16px' }}>Post</button>

      <div style={{ marginTop: '1.5rem' }}>
        {comments.length === 0 && <p style={{ color: '#999' }}>No comments yet. Be the first!</p>}
        {comments.map(c => (
          <div key={c.id} style={{ borderTop: '1px solid #eee', padding: '12px 0' }}>
            <p style={{ margin: 0 }}>{c.body}</p>
            <span style={{ fontSize: '12px', color: '#999' }}>{new Date(c.createdAt).toLocaleString()}</span>

            <button
              onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              style={{ marginLeft: '12px', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
            >
              Reply
            </button>

            {replyingTo === c.id && (
              <div style={{ marginTop: '8px' }}>
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  maxLength={280}
                  placeholder="Write a reply..."
                  style={{ width: '100%', height: '60px', padding: '8px', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '12px', color: '#999', textAlign: 'right' }}>{replyBody.length}/280</div>
                <button onClick={() => postReply(c.id)} style={{ marginTop: '4px', padding: '6px 12px' }}>Post Reply</button>
              </div>
            )}

            {c.replies.length > 0 && (
              <div style={{ marginLeft: '24px', marginTop: '8px' }}>
                {c.replies.map(r => (
                  <div key={r.id} style={{ borderTop: '1px solid #f5f5f5', padding: '8px 0' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>{r.body}</p>
                    <span style={{ fontSize: '12px', color: '#999' }}>{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
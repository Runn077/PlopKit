import { useEffect, useState } from 'react'
import styles from './comments.css?inline'

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <>
      <style>{styles}</style>
      <div className="widget">
        <h3>{comments.length} Comments</h3>

        <div className="input-area">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={280}
            placeholder="Add a comment..."
          />
          <div className="input-actions">
            <span className="char-count">{body.length}/280</span>
            <button className="btn-post" onClick={postComment} disabled={!body.trim()}>
              Post
            </button>
          </div>
        </div>

        <div className="comments-list">
          {comments.length === 0 && <p className="empty">No comments yet. Be the first!</p>}
          {comments.map(c => (
            <div key={c.id} className="comment">
              <p className={`comment-body ${expanded.has(c.id) ? 'expanded' : ''}`}>
                {c.body}
              </p>
              {c.body.length > 20 && (
                <button className="btn-show-more" onClick={() => toggleExpanded(c.id)}>
                  {expanded.has(c.id) ? 'Show less' : 'Show more'}
                </button>
              )}
              <div className="comment-meta">
                <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                <button className="btn-reply" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}>
                  {replyingTo === c.id ? 'Cancel' : 'Reply'}
                </button>
              </div>

              {replyingTo === c.id && (
                <div className="reply-input-area">
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    maxLength={280}
                    placeholder="Add a reply..."
                    autoFocus
                  />
                  <div className="reply-actions">
                    <span className="char-count">{replyBody.length}/280</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-cancel" onClick={() => { setReplyingTo(null); setReplyBody('') }}>Cancel</button>
                      <button className="btn-post-reply" onClick={() => postReply(c.id)} disabled={!replyBody.trim()}>Reply</button>
                    </div>
                  </div>
                </div>
              )}

              {c.replies.length > 0 && (
                <div className="replies">
                  {c.replies.map(r => (
                    <div key={r.id} className="reply">
                      <p className="reply-body">{r.body}</p>
                      <span className="reply-time">{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
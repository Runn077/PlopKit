import { useEffect, useState } from 'react'
import CommentItem from './CommentItem'
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

  const handleReplyPosted = (commentId: string, reply: Reply) => {
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
    ))
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
            <CommentItem
              key={c.id}
              comment={c}
              siteKey={siteKey}
              pageUrl={pageUrl}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </div>
      </div>
    </>
  )
}
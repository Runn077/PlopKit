import { useState } from 'react'
import ReplyItem from './ReplyItem'

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
  comment: Comment
  siteKey: string
  pageUrl: string
  onReplyPosted: (commentId: string, reply: Reply) => void
}

export default function CommentItem({ comment, siteKey, pageUrl, onReplyPosted }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')

  const LIMIT = 200
  const MAX_LINES = 3
  const lines = comment.body.split('\n')
  const isLong = comment.body.length > LIMIT || lines.length > MAX_LINES

  let displayBody: string
  if (expanded || !isLong) {
    displayBody = comment.body
  } else {
    if (lines.length > MAX_LINES) {
      displayBody = lines.slice(0, MAX_LINES).join('\n') + '...'
    } else {
      displayBody = comment.body.slice(0, LIMIT) + '...'
    }
  }


  const postReply = async () => {
    if (!replyBody.trim()) return
    const reply = await fetch('http://localhost:3000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_key: siteKey, page_url: pageUrl, body: replyBody, parent_id: comment.id }),
    }).then(res => res.json())
    onReplyPosted(comment.id, reply)
    setReplyOpen(false)
    setReplyBody('')
  }

  return (
    <div className="comment">
      <p className={`comment-body ${expanded ? 'expanded' : ''}`}>{displayBody}</p>

      {isLong && (
        <button className="btn-show-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}

      <div className="comment-meta">
        <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
        <div className="comment-actions">
          <button className="btn-vote">👍</button>
          <button className="btn-vote">👎</button>
          <button className="btn-reply" onClick={() => setReplyOpen(!replyOpen)}>
            {replyOpen ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>

      {replyOpen && (
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
              <button className="btn-cancel" onClick={() => { setReplyOpen(false); setReplyBody('') }}>Cancel</button>
              <button className="btn-post-reply" onClick={postReply} disabled={!replyBody.trim()}>Reply</button>
            </div>
          </div>
        </div>
      )}

      {comment.replies.length > 0 && (
        <>
          <button className="btn-show-replies" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>

          {showReplies && (
            <div className="replies">
              {comment.replies.map(r => (
                <ReplyItem key={r.id} reply={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
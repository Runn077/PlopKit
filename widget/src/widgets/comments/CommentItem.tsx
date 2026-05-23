import { useState } from 'react'
import ReplyItem from './ReplyItem'
import { useToast } from './useToast'
import type { Comment, Reply, NewComment } from './types'

interface Props {
  comment: Comment
  widgetKey: string
  pageUrl: string
}

export default function CommentItem({ comment, widgetKey, pageUrl }: Props) {
  const [replies, setReplies] = useState<Reply[]>(comment.replies)
  const [expanded, setExpanded] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const { message, fading, show } = useToast()

  const LIMIT = 1000
  const MAX_LINES = 3
  const lines = comment.body.split('\n')
  const isLong = comment.body.length > LIMIT || lines.length > MAX_LINES

  let displayBody: string
  if (expanded || !isLong) {
    displayBody = comment.body
  } else {
    displayBody = lines.length > MAX_LINES
      ? lines.slice(0, MAX_LINES).join('\n') + '...'
      : comment.body.slice(0, LIMIT) + '...'
  }

  const postReply = async () => {
    if (!replyBody.trim()) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body: replyBody,
        parent_id: comment.id,
      }),
    })

    const data: NewComment = await res.json()

    if (!res.ok) {
      show((data as any).error || 'Failed to post reply')
      return
    }

    setReplyBody('')
    setReplyOpen(false)

    if (data.status === 'approved') {
      setReplies(prev => [...prev, { id: data.id, body: data.body, createdAt: data.createdAt }])
      setShowReplies(true)
      show('Reply posted')
    } else {
      show('Your reply has been submitted and is awaiting approval.')
    }
  }

  return (
    <div className="comment">
      <p className="comment-body">{displayBody}</p>
      {isLong && (
        <button className="btn-show-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <div className="comment-meta">
        <span className="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
        <div className="comment-actions">
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
            maxLength={1000}
            placeholder="Add a reply..."
            autoFocus
          />
          {message && (
            <div className={`toast ${fading ? 'toast-fade-out' : ''}`}>{message}</div>
          )}
          <div className="reply-actions">
            <span className="char-count">{replyBody.length}/1000</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-cancel" onClick={() => { setReplyOpen(false); setReplyBody('') }}>
                Cancel
              </button>
              <button className="btn-post-reply" onClick={postReply} disabled={!replyBody.trim()}>
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
      {replies.length > 0 && (
        <>
          <button className="btn-show-replies" onClick={() => setShowReplies(!showReplies)}>
            {showReplies ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && (
            <div className="replies">
              {replies.map(r => (
                <ReplyItem key={r.id} reply={r} widgetKey={widgetKey} pageUrl={pageUrl} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
import { useState } from 'react'
import { useToast } from './useToast'
import type { Reply } from './types'

interface Props {
  reply: Reply
  widgetKey: string
  pageUrl: string
  parentId: string
  onReplyPosted: (reply: Reply) => void
}

export default function ReplyItem({ reply, widgetKey, pageUrl, parentId, onReplyPosted }: Props) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const { message, fading, show } = useToast()

  const isQuoteDeleted = reply.quoted && (reply.quoted.deletedAt !== null || reply.quoted.status !== 'approved')

  const postReply = async () => {
    if (!replyBody.trim()) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body: replyBody,
        parent_id: parentId,
        quoted_id: reply.id,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      show(data.error || 'Failed to post reply')
      return
    }

    setReplyBody('')
    setReplyOpen(false)

    if (data.status === 'approved') {
      onReplyPosted({
        id: data.id,
        body: data.body,
        createdAt: data.createdAt,
        quotedId: data.quotedId,
        quoted: data.quoted,
        isOwnerReply: false,
      })
      show('Reply posted!')
    } else {
      show('Your reply has been submitted and is awaiting approval.')
    }
  }

  return (
    <div className="reply">
      {reply.isOwnerReply && <span className="owner-badge">Site owner</span>}
      {reply.quoted && (
        <div className="quoted-comment">
          <p className="quoted-body">
            {isQuoteDeleted ? 'Deleted message' : reply.quoted.body}
          </p>
        </div>
      )}
      <p className="reply-body">{reply.body}</p>
      <div className="reply-meta">
        <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
        <button className="btn-reply" onClick={() => setReplyOpen(!replyOpen)}>
          {replyOpen ? 'Cancel' : 'Reply'}
        </button>
      </div>
      {replyOpen && (
        <div className="reply-input-area">
          <div className="quoted-preview">
            <p className="quoted-preview-body">
              {reply.body}
            </p>
          </div>
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
    </div>
  )
}
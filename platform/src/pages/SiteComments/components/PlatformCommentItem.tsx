import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import type { Comment, Reply } from '../../../types'
import '../SiteComments.css'

interface Props {
  comment: Comment
  pinnedCommentId: string | null
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onReplyPosted: (commentId: string, reply: Reply) => void
  onPin: (commentId: string) => Promise<void>
  onUnpin: () => Promise<void>
}

function PlatformReplyItem({
  reply,
  parentId,
  onDelete,
  onReplyPosted,
}: {
  reply: Reply
  parentId: string
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onReplyPosted: (commentId: string, reply: Reply) => void
}) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const handleOwnerReply = async () => {
    if (!replyBody.trim()) return
    setReplyLoading(true)
    const res = await apiFetch(`/comments/${reply.id}/owner-reply`, {
      method: 'POST',
      body: JSON.stringify({ body: replyBody }),
    })
    if (res.ok) {
      const newReply = await res.json()
      onReplyPosted(parentId, newReply)
      setReplyBody('')
      setReplyOpen(false)
    }
    setReplyLoading(false)
  }

  return (
    <div className="sc-reply">
      {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      <p className="sc-reply-body">{reply.body}</p>
      <div className="sc-reply-meta">
        <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
        <div className="sc-comment-actions">
          <button className="sc-btn sc-btn-danger" onClick={() => onDelete(reply.id, parentId)}>
            Delete
          </button>
          <button className="sc-btn-reply-text" onClick={() => setReplyOpen(v => !v)}>
            {replyOpen ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>
      {replyOpen && (
        <div className="sc-reply-input">
          <textarea
            className="sc-reply-textarea"
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="Reply as site owner..."
            maxLength={1000}
            autoFocus
          />
          <div className="sc-reply-input-actions">
            <span className="sc-char-count">{replyBody.length}/1000</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="sc-btn-cancel-text" onClick={() => { setReplyOpen(false); setReplyBody('') }}>
                Cancel
              </button>
              <button
                className="sc-btn sc-btn-primary"
                onClick={handleOwnerReply}
                disabled={replyLoading || !replyBody.trim()}
              >
                {replyLoading ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlatformCommentItem({ comment, pinnedCommentId, onDelete, onReplyPosted, onPin, onUnpin }: Props) {
  const [showReplies, setShowReplies] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  const isPinned = pinnedCommentId === comment.id
  const hasPinnedOther = pinnedCommentId !== null && pinnedCommentId !== comment.id

  const handleOwnerReply = async () => {
    if (!replyBody.trim()) return
    setReplyLoading(true)
    const res = await apiFetch(`/comments/${comment.id}/owner-reply`, {
      method: 'POST',
      body: JSON.stringify({ body: replyBody }),
    })
    if (res.ok) {
      const newReply = await res.json()
      onReplyPosted(comment.id, newReply)
      setReplyBody('')
      setReplyOpen(false)
      setShowReplies(true)
    }
    setReplyLoading(false)
  }

  const handlePin = async () => {
    setPinLoading(true)
    await onPin(comment.id)
    setPinLoading(false)
  }

  const handleUnpin = async () => {
    setPinLoading(true)
    await onUnpin()
    setPinLoading(false)
  }

  return (
    <div className={`sc-comment ${isPinned ? 'sc-comment-pinned' : ''}`}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        {isPinned && <span className="sc-pin-badge">Pinned</span>}
        {comment.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      </div>
      <p className="sc-comment-body">{comment.body}</p>
      <div className="sc-comment-meta">
        <div className="sc-comment-info">
          <span className="sc-comment-url">{comment.pageUrl}</span>
          <span className="sc-comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="sc-comment-actions">
          <button className="sc-btn sc-btn-danger" onClick={() => onDelete(comment.id)}>
            Delete
          </button>
          {isPinned ? (
            <button className="sc-btn" onClick={handleUnpin} disabled={pinLoading}>
              Remove pin
            </button>
          ) : !hasPinnedOther ? (
            <button className="sc-btn" onClick={handlePin} disabled={pinLoading}>
              Pin
            </button>
          ) : null}
          <button className="sc-btn-reply-text" onClick={() => setReplyOpen(v => !v)}>
            {replyOpen ? 'Cancel' : 'Reply'}
          </button>
        </div>
      </div>
      {replyOpen && (
        <div className="sc-reply-input">
          <textarea
            className="sc-reply-textarea"
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="Reply as site owner..."
            maxLength={1000}
            autoFocus
          />
          <div className="sc-reply-input-actions">
            <span className="sc-char-count">{replyBody.length}/1000</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="sc-btn-cancel-text" onClick={() => { setReplyOpen(false); setReplyBody('') }}>
                Cancel
              </button>
              <button
                className="sc-btn sc-btn-primary"
                onClick={handleOwnerReply}
                disabled={replyLoading || !replyBody.trim()}
              >
                {replyLoading ? 'Posting...' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
      {comment.replies.length > 0 && (
        <>
          <button className="sc-replies-toggle" onClick={() => setShowReplies(v => !v)}>
            {showReplies
              ? 'Hide replies'
              : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && (
            <div className="sc-replies">
              {comment.replies.map(reply => (
                <PlatformReplyItem
                  key={reply.id}
                  reply={reply}
                  parentId={comment.id}
                  onDelete={onDelete}
                  onReplyPosted={onReplyPosted}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PlatformCommentItem
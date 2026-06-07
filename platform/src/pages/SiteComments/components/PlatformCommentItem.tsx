import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import type { Comment, Reply } from '../../../types'
import { useSession } from '../../../lib/auth-client'
import '../SiteComments.css'

const BODY_LIMIT = 1000
const MAX_LINES = 3

function truncateBody(body: string, expanded: boolean) {
  const lines = body.split('\n')
  const isLong = body.length > BODY_LIMIT || lines.length > MAX_LINES
  if (expanded || !isLong) return { displayBody: body, isLong }
  const displayBody = lines.length > MAX_LINES
    ? lines.slice(0, MAX_LINES).join('\n') + '...'
    : body.slice(0, BODY_LIMIT) + '...'
  return { displayBody, isLong }
}

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
  const { data: session } = useSession()

  const isQuoteDeleted = reply.quoted && (reply.quoted.deletedAt !== null || reply.quoted.status !== 'approved')

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
      {reply.quoted && (
        <div className="sc-quoted-comment">
          <p className="sc-quoted-body">
            {isQuoteDeleted ? 'Deleted message' : reply.quoted.body}
          </p>
        </div>
      )}
      {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      <span className="sc-reply-author">{reply.isOwnerReply ? session?.user.name : reply.authorName}</span>
      <p className="sc-reply-body">{reply.body}</p>
      <div className="sc-reply-meta">
        <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleString()}</span>
        <button className="sc-btn-reply-text" onClick={() => setReplyOpen(v => !v)}>
          {replyOpen ? 'Cancel' : 'Reply'}
        </button>
        <div className="sc-comment-mod-actions">
          <button className="sc-btn sc-btn-danger" onClick={() => onDelete(reply.id, parentId)}>
            Delete
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
                className="sc-btn-post-reply"
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
  const [expanded, setExpanded] = useState(false)
  const { data: session } = useSession()

  const isPinned = pinnedCommentId === comment.id
  const hasPinnedOther = pinnedCommentId !== null && pinnedCommentId !== comment.id
  const { displayBody, isLong } = truncateBody(comment.body, expanded)

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
      {(isPinned || comment.isOwnerReply) && (
        <div className="sc-comment-badges">
          {isPinned && <span className="sc-pin-badge">Pinned</span>}
          {comment.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
        </div>
      )}
      <span className="sc-comment-author">{comment.isOwnerReply ? session?.user.name : comment.authorName}</span>
      <p className="sc-comment-body">{displayBody}</p>
      {isLong && (
        <button className="sc-btn-show-more" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <span className="sc-comment-url">{comment.pageUrl}</span>
      <div className="sc-comment-meta">
        <span className="sc-comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
        <button className="sc-btn-reply-text" onClick={() => setReplyOpen(v => !v)}>
          {replyOpen ? 'Cancel' : 'Reply'}
        </button>
        <div className="sc-comment-mod-actions">
          <button className="sc-btn sc-btn-danger" onClick={() => onDelete(comment.id)}>
            Delete
          </button>
          {isPinned ? (
            <button className="sc-btn sc-btn-pin" onClick={handleUnpin} disabled={pinLoading}>
              Remove pin
            </button>
          ) : !hasPinnedOther ? (
            <button className="sc-btn sc-btn-pin" onClick={handlePin} disabled={pinLoading}>
              Pin
            </button>
          ) : null}
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
                className="sc-btn-post-reply"
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
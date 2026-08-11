import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import type { Comment, Reply } from '../../../types'
import { useSession } from '../../../lib/auth-client'
import './PlatformCommentItem.css'
import '../shared.css'
import { timeAgo } from '../../../lib/timeago'
import { truncateBody } from '../../../lib/truncateBody'
import PlatformReplyItem from './PlatformReplyItem'
import ReplyArea from './ReplyArea'

interface Props {
  comment: Comment
  pinnedCommentId: string | null
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onReplyPosted: (commentId: string, reply: Reply) => void
  onPin: (commentId: string) => Promise<void>
  onUnpin: () => Promise<void>
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
    <div className={`sc-comment ${isPinned ? 'sc-comment-pinned' : ''}`} id={`comment-${comment.id}`}>
      {(isPinned || comment.isOwnerReply) && (
        <div className="sc-comment-badges">
          {isPinned && <span className="sc-pin-badge">Pinned</span>}
          {comment.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
        </div>
      )}
      <span className="sc-comment-author">{comment.isOwnerReply ? session?.user.name : comment.authorName}</span>
      {comment.commenterDisplayId && !comment.isOwnerReply && (
        <span className="sc-commenter-id">#{comment.commenterDisplayId}</span>
      )}
      <p className="sc-comment-body">{displayBody}</p>
      {isLong && (
        <button className="sc-btn-show-more" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <span className="sc-comment-url">{comment.pageUrl}</span>
      <div className="sc-comment-meta">
        <span className="sc-comment-date">
          {timeAgo(comment.createdAt)} · {new Date(comment.createdAt).toLocaleDateString()}
        </span>
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
        <ReplyArea
          value={replyBody}
          onChange={setReplyBody}
          onCancel={() => { setReplyOpen(false); setReplyBody('') }}
          onSubmit={handleOwnerReply}
          loading={replyLoading}
        />
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
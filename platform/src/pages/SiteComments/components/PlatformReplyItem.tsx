import { useState } from 'react'
import { apiFetch } from '../../../lib/api'
import type { Reply } from '../../../types'
import { useSession } from '../../../lib/auth-client'
import './PlatformReplyItem.css'
import { timeAgo } from '../../../lib/timeago'
import ReplyArea from './ReplyArea'
import { truncateBody } from '../../../lib/truncateBody'
import '../shared.css'

interface Props {
  reply: Reply
  parentId: string
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onReplyPosted: (commentId: string, reply: Reply) => void
}

function PlatformReplyItem({ reply, parentId, onDelete, onReplyPosted }: Props) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { data: session } = useSession()

  const { displayBody, isLong } = truncateBody(reply.body, expanded)
  const isQuoteDeleted = !!reply.quoted && (reply.quoted.deletedAt !== null || reply.quoted.status !== 'approved')

  function scrollToQuoted() {
    if (isQuoteDeleted || !reply.quotedId) return
    const target = document.getElementById(`comment-${reply.quotedId}`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.classList.add('sc-quoted-highlight')
    setTimeout(() => target.classList.remove('sc-quoted-highlight'), 1600)
  }

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
    <div className="sc-reply" id={`comment-${reply.id}`}>
      {reply.quoted && (
        <button type="button" className="sc-quoted-comment" onClick={scrollToQuoted} disabled={isQuoteDeleted}>
          <p className="sc-quoted-body">
            {isQuoteDeleted ? 'Deleted message' : reply.quoted.body}
          </p>
        </button>
      )}
      {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      <span className="sc-reply-author">{reply.isOwnerReply ? session?.user.name : reply.authorName}</span>
      {reply.commenterDisplayId && !reply.isOwnerReply && (
        <span className="sc-commenter-id">#{reply.commenterDisplayId}</span>
      )}
      <p className="sc-reply-body">{displayBody}</p>
      {isLong && (
        <button className="sc-btn-show-more" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
      <div className="sc-reply-meta">
        <span className="sc-comment-date">
          {timeAgo(reply.createdAt)} · {new Date(reply.createdAt).toLocaleDateString()}
        </span>
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
        <ReplyArea
          value={replyBody}
          onChange={setReplyBody}
          onCancel={() => { setReplyOpen(false); setReplyBody('') }}
          onSubmit={handleOwnerReply}
          loading={replyLoading}
        />
      )}
    </div>
  )
}

export default PlatformReplyItem
import { useState } from 'react'
import '../SiteComments.css'
import '../shared.css'
import type { Reply } from '../../../types'
import { truncateBody } from '../../../lib/truncateBody'
import { timeAgo } from '../../../lib/timeago'

interface Props {
  reply: Reply
  replyActions?: (reply: Reply) => React.ReactNode
}

function ReplyRow({ reply, replyActions }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { displayBody, isLong } = truncateBody(reply.body, expanded)

  return (
    <div className="sc-reply">
      {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      <span className="sc-reply-author">{reply.authorName}</span>
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
        {replyActions && (
          <div className="sc-comment-mod-actions">{replyActions(reply)}</div>
        )}
      </div>
    </div>
  )
}

export default ReplyRow
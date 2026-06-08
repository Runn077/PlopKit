import { useState } from 'react'
import type { Reply } from '../../../types'
import { truncateBody } from '../../../lib/truncateBody'
import { timeAgo } from '../../../lib/timeago'
import '../SiteComments.css'

interface Props {
  reply: Reply
  expiry?: string
  actions: React.ReactNode
}

function OrphanReplyItem({ reply, expiry, actions }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [parentExpanded, setParentExpanded] = useState(false)
  const { displayBody, isLong } = truncateBody(reply.body, expanded)
  const parentBody = reply.parent?.body
  const parentTruncated = parentBody ? truncateBody(parentBody, parentExpanded) : null

  return (
    <div className="sc-comment">
      {parentTruncated && (
        <>
          <p className="sc-comment-body sc-comment-body--context">{parentTruncated.displayBody}</p>
          {parentTruncated.isLong && (
            <button className="sc-btn-show-more" onClick={() => setParentExpanded(v => !v)}>
              {parentExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      )}
      <div className="sc-replies">
        <div className="sc-reply">
          {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
          <span className="sc-reply-author">{reply.authorName}</span>
          <p className="sc-reply-body">{displayBody}</p>
          {isLong && (
            <button className="sc-btn-show-more" onClick={() => setExpanded(v => !v)}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
          <div className="sc-reply-meta">
            <span className="sc-comment-date">
              {timeAgo(reply.createdAt)} · {new Date(reply.createdAt).toLocaleDateString()}
              {expiry && <> · <span className="sc-expiry">{expiry}</span></>}
            </span>
            <div className="sc-comment-mod-actions">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrphanReplyItem

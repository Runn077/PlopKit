import { useState } from 'react'
import '../SiteComments.css'
import type { Comment, Reply } from '../../../types'
import { truncateBody } from '../../../lib/truncateBody'
import { timeAgo } from '../../../lib/timeago'

interface Props {
  comment: Comment
  actions: React.ReactNode
  replyActions?: (reply: Reply) => React.ReactNode
  expiry?: string
}

function ReplyRow({
  reply,
  replyActions,
}: {
  reply: Reply
  replyActions?: (reply: Reply) => React.ReactNode
}) {
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

function CommentRow({ comment, actions, replyActions, expiry }: Props) {
  const [showReplies, setShowReplies] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const { displayBody, isLong } = truncateBody(comment.body, expanded)

  return (
    <div className="sc-comment">
      {comment.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      <span className="sc-comment-author">{comment.authorName}</span>
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
          {expiry && <> · <span className="sc-expiry">{expiry}</span></>}
        </span>
        <div className="sc-comment-mod-actions">{actions}</div>
      </div>
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
                <ReplyRow key={reply.id} reply={reply} replyActions={replyActions} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CommentRow

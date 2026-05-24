import { useState } from 'react'
import '../SiteComments.css'
import type { Comment, Reply } from '../../../types'

interface Props {
  comment: Comment
  actions: React.ReactNode
  replyActions?: (reply: Reply) => React.ReactNode
}

function CommentRow({ comment, actions, replyActions }: Props) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="sc-comment">
      {comment.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
      <p className="sc-comment-body">{comment.body}</p>
      <div className="sc-comment-meta">
        <div className="sc-comment-info">
          <span className="sc-comment-url">{comment.pageUrl}</span>
          <span className="sc-comment-date">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="sc-comment-actions">{actions}</div>
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
                <div key={reply.id} className="sc-reply">
                  {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
                  <p className="sc-reply-body">{reply.body}</p>
                  <div className="sc-reply-meta">
                    <span className="sc-reply-date">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                    {replyActions && replyActions(reply)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CommentRow
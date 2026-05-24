import { useState } from 'react'
import '../SiteComments.css'
import type { Comment, Reply } from '../../../types'

interface Props {
  comment: Comment
  actions: React.ReactNode
  replyActions?: (reply: Reply) => React.ReactNode
  onOwnerReply: (commentId: string, body: string) => Promise<void>
}

function CommentRow({ comment, actions, replyActions, onOwnerReply }: Props) {
  const [showReplies, setShowReplies] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const handleOwnerReply = async (targetId: string) => {
    if (!replyBody.trim()) return
    setReplyLoading(true)
    await onOwnerReply(targetId, replyBody)
    setReplyBody('')
    setReplyOpen(false)
    setShowReplies(true)
    setReplyLoading(false)
  }

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
        <div className="sc-comment-actions">
          {actions}
          <button className="sc-btn" onClick={() => setReplyOpen(v => !v)}>
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
            <button
              className="sc-btn sc-btn-primary"
              onClick={() => handleOwnerReply(comment.id)}
              disabled={replyLoading || !replyBody.trim()}
            >
              {replyLoading ? 'Posting...' : 'Post reply'}
            </button>
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
                <div key={reply.id} className="sc-reply">
                  {reply.isOwnerReply && <span className="sc-owner-badge">Site owner</span>}
                  <p className="sc-reply-body">{reply.body}</p>
                  <div className="sc-reply-meta">
                    <span className="sc-reply-date">
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {replyActions && replyActions(reply)}
                      <button className="sc-btn" onClick={() => setReplyOpen(v => !v)}>
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
                        <button
                          className="sc-btn sc-btn-primary"
                          onClick={() => handleOwnerReply(reply.id)}
                          disabled={replyLoading || !replyBody.trim()}
                        >
                          {replyLoading ? 'Posting...' : 'Post reply'}
                        </button>
                      </div>
                    </div>
                  )}
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
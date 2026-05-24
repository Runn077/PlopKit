import type { Comment, Reply } from '../../../types'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

const PENDING_EXPIRY_DAYS = 30

function getPendingExpiry(createdAt: string) {
  const expires = new Date(createdAt)
  expires.setDate(expires.getDate() + PENDING_EXPIRY_DAYS)
  const days = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Expires today'
  if (days === 1) return 'Expires in 1 day'
  return `Expires in ${days} days`
}

interface Props {
  comments: Comment[]
  orphanedReplies: Reply[]
  autoApprove: boolean
  onApprove: (commentId: string) => Promise<void>
  onReject: (commentId: string) => Promise<void>
  onApproveReply: (replyId: string, parentId: string) => Promise<void>
  onRejectReply: (replyId: string, parentId: string) => Promise<void>
  onToggleAutoApprove: (value: boolean) => Promise<void>
}

function PendingTab({ comments, orphanedReplies, autoApprove, onApprove, onReject, onApproveReply, onRejectReply, onToggleAutoApprove }: Props) {
  return (
    <div>
      <div className="sc-auto-approve">
        <div className="sc-auto-approve-label">
          <span>Auto-approve comments</span>
          <span className="sc-auto-approve-hint">New comments will be approved automatically</span>
        </div>
        <button
          className={`sc-toggle ${autoApprove ? 'sc-toggle-on' : ''}`}
          onClick={() => onToggleAutoApprove(!autoApprove)}
        >
          <span className="sc-toggle-knob" />
        </button>
      </div>
      {comments.length === 0 && orphanedReplies.length === 0
        ? <p className="sc-empty">No pending comments.</p>
        : (
          <div className="sc-comment-list">
            {comments.map(comment => (
              <CommentRow
                key={comment.id}
                comment={comment}
                actions={
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="sc-btn sc-btn-approve" onClick={() => onApprove(comment.id)}>Approve</button>
                    <button className="sc-btn sc-btn-danger" onClick={() => onReject(comment.id)}>Reject</button>
                  </div>
                }
                replyActions={(reply) => (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="sc-btn sc-btn-approve" onClick={() => onApproveReply(reply.id, comment.id)}>Approve</button>
                    <button className="sc-btn sc-btn-danger" onClick={() => onRejectReply(reply.id, comment.id)}>Reject</button>
                  </div>
                )}
                expiry={getPendingExpiry(comment.createdAt)}
              />
            ))}
            {orphanedReplies.length > 0 && (
              <>
                <p className="sc-section-label">Replies to approved comments</p>
                {orphanedReplies.map(reply => (
                  <div key={reply.id} className="sc-comment">
                    <p className="sc-comment-body">{reply.parent?.body}</p>
                    <div className="sc-replies">
                      <div className="sc-reply">
                        <p className="sc-reply-body">{reply.body}</p>
                        <div className="sc-reply-meta">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                            <span className="sc-expiry">Expires {getPendingExpiry(reply.createdAt)}</span>
                          </div>
                          <div className="sc-comment-actions">
                            <button className="sc-btn sc-btn-approve" onClick={() => onApproveReply(reply.id, reply.parentId!)}>Approve</button>
                            <button className="sc-btn sc-btn-danger" onClick={() => onRejectReply(reply.id, reply.parentId!)}>Reject</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      }
    </div>
  )
}

export default PendingTab
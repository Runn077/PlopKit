import type { Comment, Reply } from '../../../types'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

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
                          <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
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
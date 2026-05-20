import type { Comment, Reply } from '../../../types'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

interface Props {
  comments: Comment[]
  orphanedReplies: Reply[]
  onApprove: (commentId: string) => Promise<void>
  onReject: (commentId: string) => Promise<void>
  onApproveReply: (replyId: string, parentId: string) => Promise<void>
  onRejectReply: (replyId: string, parentId: string) => Promise<void>
}

function PendingTab({ comments, orphanedReplies, onApprove, onReject, onApproveReply, onRejectReply }: Props) {
  if (comments.length === 0 && orphanedReplies.length === 0) {
    return <p className="sc-empty">No pending comments.</p>
  }

  return (
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
    </div>
  )
}

export default PendingTab
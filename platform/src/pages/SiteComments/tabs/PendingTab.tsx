import type { Comment } from '../../../types'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

interface Props {
  comments: Comment[]
  onApprove: (commentId: string) => Promise<void>
  onReject: (commentId: string) => Promise<void>
}

function PendingTab({ comments, onApprove, onReject }: Props) {
  if (comments.length === 0) {
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
              <button className="sc-btn sc-btn-approve" onClick={() => onApprove(comment.id)}>
                Approve
              </button>
              <button className="sc-btn sc-btn-danger" onClick={() => onReject(comment.id)}>
                Reject
              </button>
            </div>
          }
        />
      ))}
    </div>
  )
}

export default PendingTab
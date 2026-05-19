import type { Comment } from '../components/CommentRow'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

interface Props {
  comments: Comment[]
  onRestore: (commentId: string) => Promise<void>
  onPermanentDelete: (commentId: string) => Promise<void>
}

function DeletedTab({ comments, onRestore, onPermanentDelete }: Props) {
  if (comments.length === 0) {
    return <p className="sc-empty">No recently deleted comments.</p>
  }

  return (
    <div className="sc-comment-list">
      {comments.map(comment => (
        <CommentRow
          key={comment.id}
          comment={comment}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sc-btn" onClick={() => onRestore(comment.id)}>
                Restore
              </button>
              <button className="sc-btn sc-btn-danger" onClick={() => onPermanentDelete(comment.id)}>
                Delete
              </button>
            </div>
          }
        />
      ))}
    </div>
  )
}

export default DeletedTab
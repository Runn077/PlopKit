import type { Comment } from '../components/CommentRow'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

interface Props {
  comments: Comment[]
  hasMore: boolean
  loadingMore: boolean
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onLoadMore: () => void
}

function CommentsTab({ comments, hasMore, loadingMore, onDelete, onLoadMore }: Props) {
  if (comments.length === 0) {
    return <p className="sc-empty">No comments yet.</p>
  }

  return (
    <div>
      <div className="sc-comment-list">
        {comments.map(comment => (
          <CommentRow
            key={comment.id}
            comment={comment}
            actions={
              <button className="sc-btn sc-btn-danger" onClick={() => onDelete(comment.id)}>
                Delete
              </button>
            }
            replyActions={(reply) => (
              <button className="sc-btn sc-btn-danger" onClick={() => onDelete(reply.id, comment.id)}>
                Delete
              </button>
            )}
          />
        ))}
      </div>
      {hasMore && (
        <button className="sc-load-more" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}

export default CommentsTab
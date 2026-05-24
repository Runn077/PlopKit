import type { Comment, Reply } from '../../../types'
import PlatformCommentItem from '../components/PlatformCommentItem'
import '../SiteComments.css'

interface Props {
  comments: Comment[]
  hasMore: boolean
  loadingMore: boolean
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onLoadMore: () => void
  onReplyPosted: (commentId: string, reply: Reply) => void
}

function CommentsTab({ comments, hasMore, loadingMore, onDelete, onLoadMore, onReplyPosted }: Props) {
  if (comments.length === 0) {
    return <p className="sc-empty">No comments yet.</p>
  }

  return (
    <div>
      <div className="sc-comment-list">
        {comments.map(comment => (
          <PlatformCommentItem
            key={comment.id}
            comment={comment}
            onDelete={onDelete}
            onReplyPosted={onReplyPosted}
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
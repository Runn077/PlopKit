import type { Comment, Reply } from '../../../types'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

const SOFT_DELETE_EXPIRY_DAYS = 7

function getDeletedExpiry(deletedAt: string) {
  const expires = new Date(deletedAt)
  expires.setDate(expires.getDate() + SOFT_DELETE_EXPIRY_DAYS)
  const days = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Expires today'
  if (days === 1) return 'Expires in 1 day'
  return `Expires in ${days} days`
}
interface Props {
  comments: Comment[]
  orphanedReplies: Reply[]
  hasMore: boolean
  loadingMore: boolean
  onRestore: (commentId: string) => Promise<void>
  onPermanentDelete: (commentId: string) => Promise<void>
  onRestoreReply: (replyId: string) => Promise<void>
  onPermanentDeleteReply: (replyId: string) => Promise<void>
  onDeleteAll: () => Promise<void>
  onLoadMore: () => void
}

function DeletedTab({ comments, orphanedReplies, hasMore, loadingMore, onRestore, onPermanentDelete, onRestoreReply, onPermanentDeleteReply, onDeleteAll, onLoadMore }: Props) {
  if (comments.length === 0 && orphanedReplies.length === 0) {
    return <p className="sc-empty">No recently deleted comments.</p>
  }

  return (
    <div>
      <div className="sc-tab-header">
        <button className="sc-btn sc-btn-danger" onClick={onDeleteAll}>Delete all</button>
      </div>
      <div className="sc-comment-list">
        {comments.map(comment => (
          <CommentRow
            key={comment.id}
            comment={comment}
            actions={
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sc-btn" onClick={() => onRestore(comment.id)}>Restore</button>
                <button className="sc-btn sc-btn-danger" onClick={() => onPermanentDelete(comment.id)}>Delete</button>
              </div>
            }
            expiry={comment.deletedAt ? getDeletedExpiry(comment.deletedAt) : undefined}
          />
        ))}
        
        {hasMore && (
          <button className="sc-load-more" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}

        {orphanedReplies.length > 0 && (
          <>
            <p className="sc-section-label">Replies to active comments</p>
            {orphanedReplies.map(reply => (
              <div key={reply.id} className="sc-comment">
                <p className="sc-comment-body">{reply.parent?.body}</p>
                <div className="sc-replies">
                  <div className="sc-reply">
                    <p className="sc-reply-body">{reply.body}</p>
                    <div className="sc-reply-meta">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                        {reply.deletedAt && (
                          <span className="sc-expiry">Expires {getDeletedExpiry(reply.deletedAt)}</span>
                        )}
                      </div>
                      <div className="sc-comment-actions">
                        <button className="sc-btn" onClick={() => onRestoreReply(reply.id)}>Restore</button>
                        <button className="sc-btn sc-btn-danger" onClick={() => onPermanentDeleteReply(reply.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default DeletedTab
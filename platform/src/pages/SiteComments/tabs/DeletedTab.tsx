import type { Comment, Reply, FeedItem } from '../../../types'
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

function getSortDate(item: FeedItem): number {
  if (item.kind === 'comment') {
    return new Date((item.data as Comment).deletedAt ?? item.data.createdAt).getTime()
  }
  return new Date((item.data as Reply).deletedAt ?? item.data.createdAt).getTime()
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

function DeletedTab({
  comments, orphanedReplies, hasMore, loadingMore,
  onRestore, onPermanentDelete, onRestoreReply, onPermanentDeleteReply, onDeleteAll, onLoadMore,
}: Props) {
  const feed: FeedItem[] = [
    ...comments.map(c => ({ kind: 'comment' as const, data: c })),
    ...orphanedReplies.map(r => ({ kind: 'orphan' as const, data: r })),
  ].sort((a, b) => getSortDate(b) - getSortDate(a))

  if (feed.length === 0) {
    return <p className="sc-empty">No recently deleted comments.</p>
  }

  return (
    <div>
      <div className="sc-tab-header">
        <button className="sc-btn sc-btn-danger" onClick={onDeleteAll}>Delete all</button>
      </div>
      <div className="sc-comment-list">
        {feed.map(item => {
          if (item.kind === 'comment') {
            const comment = item.data as Comment
            return (
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
            )
          }

          const reply = item.data as Reply
          return (
            <div key={reply.id} className="sc-comment">
              {reply.parent && (
                <p className="sc-comment-body sc-comment-body--context">{reply.parent.body}</p>
              )}
              <div className="sc-replies">
                <div className="sc-reply">
                  <p className="sc-reply-body">{reply.body}</p>
                  <div className="sc-reply-meta">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                      {reply.deletedAt && (
                        <span className="sc-expiry">{getDeletedExpiry(reply.deletedAt)}</span>
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
          )
        })}

        {hasMore && (
          <button className="sc-load-more" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}

export default DeletedTab
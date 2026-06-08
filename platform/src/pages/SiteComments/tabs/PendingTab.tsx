import type { Comment, Reply, FeedItem } from '../../../types'
import CommentRow from '../components/CommentRow'
import OrphanReplyItem from '../components/OrphanReplyItem'
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
  hasMore: boolean
  loadingMore: boolean
  onApprove: (commentId: string) => Promise<void>
  onReject: (commentId: string) => Promise<void>
  onApproveReply: (replyId: string, parentId: string) => Promise<void>
  onRejectReply: (replyId: string, parentId: string) => Promise<void>
  onToggleAutoApprove: (value: boolean) => Promise<void>
  onLoadMore: () => void
}

function PendingTab({
  comments, orphanedReplies, autoApprove, hasMore, loadingMore,
  onApprove, onReject, onApproveReply, onRejectReply, onToggleAutoApprove, onLoadMore,
}: Props) {
  const feed: FeedItem[] = [
    ...comments.map(c => ({ kind: 'comment' as const, data: c })),
    ...orphanedReplies.map(r => ({ kind: 'orphan' as const, data: r })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime())

  const isEmpty = feed.length === 0

  return (
    <div className="sc-comments-tab">
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

      {isEmpty ? (
        <p className="sc-empty">No pending comments.</p>
      ) : (
        <div className="sc-comment-list">
          {feed.map(item => {
            if (item.kind === 'comment') {
              const comment = item.data as Comment
              return (
                <CommentRow
                  key={comment.id}
                  comment={comment}
                  actions={
                    <>
                      <button className="sc-btn sc-btn-approve" onClick={() => onApprove(comment.id)}>Approve</button>
                      <button className="sc-btn sc-btn-danger" onClick={() => onReject(comment.id)}>Reject</button>
                    </>
                  }
                  replyActions={(reply) => (
                    <>
                      <button className="sc-btn sc-btn-approve" onClick={() => onApproveReply(reply.id, comment.id)}>Approve</button>
                      <button className="sc-btn sc-btn-danger" onClick={() => onRejectReply(reply.id, comment.id)}>Reject</button>
                    </>
                  )}
                  expiry={getPendingExpiry(comment.createdAt)}
                />
              )
            }

            const reply = item.data as Reply
            return (
              <OrphanReplyItem
                key={reply.id}
                reply={reply}
                expiry={getPendingExpiry(reply.createdAt)}
                actions={
                  <>
                    <button className="sc-btn sc-btn-approve" onClick={() => onApproveReply(reply.id, reply.parentId)}>Approve</button>
                    <button className="sc-btn sc-btn-danger" onClick={() => onRejectReply(reply.id, reply.parentId)}>Reject</button>
                  </>
                }
              />
            )
          })}

          {hasMore && (
            <button className="sc-load-more" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default PendingTab
import type { Comment, Reply } from '../../../types'
import CommentRow from '../components/CommentRow'
import '../SiteComments.css'

interface Props {
  comments: Comment[]
  orphanedReplies: Reply[]
  onRestore: (commentId: string) => Promise<void>
  onPermanentDelete: (commentId: string) => Promise<void>
  onRestoreReply: (replyId: string) => Promise<void>
  onPermanentDeleteReply: (replyId: string) => Promise<void>
  onDeleteAll: () => Promise<void>
}

function DeletedTab({ comments, orphanedReplies, onRestore, onPermanentDelete, onRestoreReply, onPermanentDeleteReply, onDeleteAll }: Props) {
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
          />
        ))}

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
                      <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
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
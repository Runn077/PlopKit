import { useState } from 'react'
import './SiteComments.css'

interface Reply {
  id: string
  body: string
  createdAt: string
}

interface Comment {
  id: string
  body: string
  pageUrl: string
  createdAt: string
  replies: Reply[]
}

interface Props {
  comments: Comment[]
  onDelete: (commentId: string, parentId?: string) => void
}

function CommentList({ comments, onDelete }: Props) {
  if (comments.length === 0) {
    return <p className="sc-empty">No comments yet.</p>
  }

  return (
    <div className="sc-comment-list">
      {comments.map(comment => (
        <CommentRow key={comment.id} comment={comment} onDelete={onDelete} />
      ))}
    </div>
  )
}

function CommentRow({ comment, onDelete }: { comment: Comment, onDelete: (id: string, parentId?: string) => void }) {
  const [showReplies, setShowReplies] = useState(false)

  return (
    <div className="sc-comment">
      <p className="sc-comment-body">{comment.body}</p>
      <div className="sc-comment-meta">
        <div className="sc-comment-info">
          <span className="sc-comment-url">{comment.pageUrl}</span>
          <span className="sc-comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
        </div>
        <button className="sc-btn sc-btn-danger" onClick={() => onDelete(comment.id)}>Delete</button>
      </div>
      {comment.replies.length > 0 && (
        <>
          <button className="sc-replies-toggle" onClick={() => setShowReplies(v => !v)}>
            {showReplies ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
          </button>
          {showReplies && (
            <div className="sc-replies">
              {comment.replies.map(reply => (
                <div key={reply.id} className="sc-reply">
                  <p className="sc-reply-body">{reply.body}</p>
                  <div className="sc-reply-meta">
                    <span className="sc-reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                    <button className="sc-btn sc-btn-danger" onClick={() => onDelete(reply.id, comment.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CommentList
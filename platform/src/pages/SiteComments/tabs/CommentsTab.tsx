import { useState } from 'react'
import type { Comment, Reply } from '../../../types'
import PlatformCommentItem from '../components/PlatformCommentItem'
import '../SiteComments.css'

interface Props {
  pinnedComment: Comment | null
  comments: Comment[]
  total: number
  hasMore: boolean
  loadingMore: boolean
  pinnedCommentId: string | null
  onDelete: (commentId: string, parentId?: string) => Promise<void>
  onLoadMore: () => void
  onReplyPosted: (commentId: string, reply: Reply) => void
  onPin: (commentId: string) => Promise<void>
  onUnpin: () => Promise<void>
  onOwnerPost: (body: string) => Promise<void>
}

function CommentsTab({
  comments, total, hasMore, loadingMore, pinnedCommentId, pinnedComment,
  onDelete, onLoadMore, onReplyPosted, onPin, onUnpin, onOwnerPost,
}: Props) {
  const [postBody, setPostBody] = useState('')
  const [posting, setPosting] = useState(false)

  const handlePost = async () => {
    if (!postBody.trim()) return
    setPosting(true)
    await onOwnerPost(postBody)
    setPostBody('')
    setPosting(false)
  }

  return (
    <div className="sc-comments-tab">
      <h3 className="sc-comments-heading">
        {total} {total === 1 ? 'Comment' : 'Comments'}
      </h3>

      <div className="sc-owner-post">
        <textarea
          className="sc-reply-textarea sc-owner-textarea"
          value={postBody}
          onChange={e => setPostBody(e.target.value)}
          placeholder="Post as site owner..."
          maxLength={1000}
        />
        <div className="sc-reply-input-actions">
          <span className="sc-char-count">{postBody.length}/1000</span>
          <button
            className="sc-btn-post"
            onClick={handlePost}
            disabled={posting || !postBody.trim()}
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="sc-empty">No comments yet.</p>
      ) : (
        <div>
          <div className="sc-comment-list">
            {pinnedComment && (
              <PlatformCommentItem
                key={pinnedComment.id}
                comment={pinnedComment}
                pinnedCommentId={pinnedComment.id}
                onDelete={onDelete}
                onReplyPosted={onReplyPosted}
                onPin={onPin}
                onUnpin={onUnpin}
              />
            )}
            {comments.map(comment => (
              <PlatformCommentItem
                key={comment.id}
                comment={comment}
                pinnedCommentId={pinnedCommentId}
                onDelete={onDelete}
                onReplyPosted={onReplyPosted}
                onPin={onPin}
                onUnpin={onUnpin}
              />
            ))}
          </div>
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

export default CommentsTab

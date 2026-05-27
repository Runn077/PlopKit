import { useEffect, useState } from 'react'
import CommentItem from './CommentItem'
import { useToast } from './useToast'
import type { Comment, NewComment, CommentsResponse } from './types'
import styles from './comments.css?inline'

interface Props {
  widgetKey: string
  pageUrl: string
}

export default function Comments({ widgetKey, pageUrl }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [body, setBody] = useState('')
  const [total, setTotal] = useState(0)
  const [pinnedCommentId, setPinnedCommentId] = useState<string | null>(null)
  const { message, fading, show } = useToast()

  const fetchComments = async (cursor?: string) => {
    setLoading(true)
    const url = `${import.meta.env.VITE_API_URL}/public/comments?widget_key=${widgetKey}&page_url=${encodeURIComponent(pageUrl)}${cursor ? `&cursor=${cursor}` : ''}`
    const data: CommentsResponse = await fetch(url).then(res => res.json())
    setComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    setHasMore(data.hasMore)
    setTotal(data.total ?? (cursor ? total : data.comments.length))
    if (!cursor) setPinnedCommentId(data.pinnedCommentId)
    setLoading(false)
  }

  useEffect(() => { fetchComments() }, [])

  const loadMore = () => {
    const lastComment = comments[comments.length - 1]
    if (lastComment) fetchComments(lastComment.id)
  }

  const postComment = async () => {
    if (!body.trim()) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget_key: widgetKey, page_url: pageUrl, body }),
    })

    const data: NewComment = await res.json()

    if (!res.ok) {
      show((data as any).error || 'Failed to post comment')
      return
    }

    setBody('')

    if (data.status === 'approved') {
      setComments(prev => [{ ...data, replies: [] }, ...prev])
      setTotal(prev => prev + 1)
      show('Comment posted!')
    } else {
      show('Your comment has been submitted and is awaiting approval.')
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="widget">
        <h3>{total} {total === 1 ? 'Comment' : 'Comments'}</h3>
        <div className="input-area">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={1000}
            placeholder="Add a comment..."
          />
          <div className="input-actions">
            <span className="char-count">{body.length}/1000</span>
            <button className="btn-post" onClick={postComment} disabled={!body.trim()}>
              Post
            </button>
          </div>
        </div>
        {message && (
          <div className={`toast ${fading ? 'toast-fade-out' : ''}`}>{message}</div>
        )}
        <div className="comments-list">
          {comments.length === 0 && !loading && (
            <p className="empty">No comments yet. Be the first!</p>
          )}
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              widgetKey={widgetKey}
              pageUrl={pageUrl}
              isPinned={pinnedCommentId === c.id}
            />
          ))}
          {hasMore && (
            <button className="btn-load-more" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
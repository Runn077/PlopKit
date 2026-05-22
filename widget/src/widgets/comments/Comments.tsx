import { useEffect, useState } from 'react'
import CommentItem from './CommentItem'
import styles from './comments.css?inline'

interface Reply {
  id: string
  body: string
  createdAt: string
}

interface Comment {
  id: string
  body: string
  createdAt: string
  replies: Reply[]
}

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
  const [message, setMessage] = useState('')
  const [messageFading, setMessageFading] = useState(false)

  const fetchComments = async (cursor?: string) => {
    setLoading(true)
    const url = `${import.meta.env.VITE_API_URL}/comments?widget_key=${widgetKey}&page_url=${encodeURIComponent(pageUrl)}${cursor ? `&cursor=${cursor}` : ''}`
    const data = await fetch(url).then(res => res.json())
    setComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    setHasMore(data.hasMore)
    setTotal(data.total ?? (cursor ? total : data.comments.length))
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [])

  const loadMore = () => {
    const lastComment = comments[comments.length - 1]
    if (lastComment) fetchComments(lastComment.id)
  }

  const postComment = async () => {
    if (!body.trim()) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setMessage(data.error || 'Failed to post comment')
      setTimeout(() => setMessageFading(true), 2500)
      setTimeout(() => {
        setMessage('')
        setMessageFading(false)
      }, 3000)
      return
    }

    setBody('')
    setMessage('Your comment is awaiting approval.')

    setTimeout(() => setMessageFading(true), 2500)
    setTimeout(() => {
      setMessage('')
      setMessageFading(false)
    }, 3000)
  }

  return (
    <>
      <style>{styles}</style>
      <div className="widget">
        <h3>{total} Comments</h3>
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
          <div className={`toast ${messageFading ? 'toast-fade-out' : ''}`}>
            {message}
          </div>
        )}
        <div className="comments-list">
          {comments.length === 0 && !loading && <p className="empty">No comments yet. Be the first!</p>}
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              widgetKey={widgetKey}
              pageUrl={pageUrl}
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
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'

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

interface Site {
  id: string
  name: string
  siteKey: string
}

function SiteComments() {
  const { siteId } = useParams()
  const [site, setSite] = useState<Site | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchSite()
  }, [siteId])

  async function fetchSite() {
    const res = await fetch(`http://localhost:3000/sites/${siteId}`, {
      credentials: 'include',
    })
    const data = await res.json()
    setSite(data)
    fetchComments(data.siteKey)
  }

  async function fetchComments(siteKey: string, cursor?: string) {
    const params = new URLSearchParams({ site_key: siteKey })
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`http://localhost:3000/comments?${params}`, {
      credentials: 'include',
    })
    const data = await res.json()

    setComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    setHasMore(data.hasMore)
    if (data.comments.length > 0) {
      setCursor(data.comments[data.comments.length - 1].id)
    }
    setLoading(false)
    setLoadingMore(false)
  }

  async function handleDelete(commentId: string) {
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (res.ok) {
      setComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  function handleLoadMore() {
    if (!site || !cursor) return
    setLoadingMore(true)
    fetchComments(site.siteKey, cursor)
  }

  if (loading) return <div>Loading...</div>
  if (!site) return <div>Site not found</div>

  const scriptTag = `<script src="http://localhost:5174/widget.js" data-site-key="${site.siteKey}" data-widget="comments"></script>`

  return (
    <div>
      < Navbar />

      <h2>{site.name} — Comments</h2>

      <div>
        <h3>Your script tag</h3>
        <code>{scriptTag}</code>
        <button onClick={() => navigator.clipboard.writeText(scriptTag)}>
          Copy
        </button>
      </div>

      <h3>Comments ({comments.length})</h3>

      {comments.length === 0 && <p>No comments yet.</p>}

      <ul>
        {comments.map(comment => (
          <li key={comment.id}>
            <p>{comment.body}</p>
            <small>{comment.pageUrl} — {new Date(comment.createdAt).toLocaleDateString()}</small>
            {comment.replies.length > 0 && (
              <ul>
                {comment.replies.map(reply => (
                  <li key={reply.id}>
                    <p>{reply.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => handleDelete(comment.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}

export default SiteComments
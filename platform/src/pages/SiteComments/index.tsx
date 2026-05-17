import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import CommentList from './CommentList'
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

interface Widget {
  id: string
  name: string
  widgetKey: string
  siteId: string
}

function SiteComments() {
  const { siteId, widgetId } = useParams()
  const navigate = useNavigate()
  const [widget, setWidget] = useState<Widget | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [widgetId])

  async function fetchData() {
    const res = await fetch(`http://localhost:3000/widgets/single/${widgetId}`, {
      credentials: 'include',
    })
    const data = await res.json()
    setWidget(data)
    fetchComments(data.widgetKey)
  }

  async function fetchComments(widgetKey: string, cursor?: string) {
    const params = new URLSearchParams({ widget_key: widgetKey })
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

  async function handleDelete(commentId: string, parentId?: string) {
    const res = await fetch(`http://localhost:3000/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId
            ? { ...c, replies: c.replies.filter(r => r.id !== commentId) }
            : c
        ))
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    }
  }

  function handleLoadMore() {
    if (!widget || !cursor) return
    setLoadingMore(true)
    fetchComments(widget.widgetKey, cursor)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div>Loading...</div>
  if (!widget) return <div>Widget not found</div>

  const scriptTag = `<script src="http://localhost:5174/widget.js" data-widget-key="${widget.widgetKey}" data-widget="comments"></script>`

  return (
    <div>
      <Navbar />
      <div className="sc-container">
        <button className="sc-back" onClick={() => navigate(`/dashboard/sites/${siteId}`)}>
          ← Back
        </button>
        <div className="sc-header">
          <h2 className="sc-title">{widget.name}</h2>
        </div>

        {/* Script tag */}
        <div className="sc-script-block">
          <div className="sc-script-header">
            <span className="sc-script-label">Script tag</span>
            <button className="sc-btn" onClick={() => handleCopy(scriptTag)}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="sc-script-code">{scriptTag}</pre>
        </div>

        {/* Comments */}
        <p className="sc-comments-title">Comments ({comments.length})</p>
        <CommentList
          comments={comments}
          onDelete={handleDelete}
        />
        {hasMore && (
          <button className="sc-load-more" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  )
}

export default SiteComments
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SubNav from './SubNav'
import CommentsTab from './tabs/CommentsTab'
import PendingTab from './tabs/PendingTab'
import DeletedTab from './tabs/DeletedTab'
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
  deletedAt?: string | null
  replies: Reply[]
}

interface Widget {
  id: string
  name: string
  widgetKey: string
  siteId: string
}

interface Site {
  id: string
  name: string
}

type Tab = 'comments' | 'pending' | 'deleted'

function SiteComments() {
  const { siteId, widgetId } = useParams()
  const navigate = useNavigate()
  const [site, setSite] = useState<Site | null>(null)
  const [widget, setWidget] = useState<Widget | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('comments')
  const [comments, setComments] = useState<Comment[]>([])
  const [pendingComments, setPendingComments] = useState<Comment[]>([])
  const [deletedComments, setDeletedComments] = useState<Comment[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [widgetId])

  useEffect(() => {
    if (!widget) return
    if (activeTab === 'pending') fetchPending(widget.widgetKey)
    if (activeTab === 'deleted') fetchDeleted(widget.widgetKey)
  }, [activeTab, widget])

  async function fetchData() {
    const [widgetRes, siteRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/widgets/single/${widgetId}`, { credentials: 'include' }),
      fetch(`${import.meta.env.VITE_API_URL}/sites/${siteId}`, { credentials: 'include' }),
    ])
    const widgetData = await widgetRes.json()
    const siteData = await siteRes.json()
    setWidget(widgetData)
    setSite(siteData)
    fetchComments(widgetData.widgetKey)
  }

  async function fetchComments(widgetKey: string, cursor?: string) {
    const params = new URLSearchParams({ widget_key: widgetKey })
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments?${params}`, { credentials: 'include' })
    const data = await res.json()
    setComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    setHasMore(data.hasMore)
    if (data.comments.length > 0) setCursor(data.comments[data.comments.length - 1].id)
    setLoading(false)
    setLoadingMore(false)
  }

  async function fetchPending(widgetKey: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/pending?widget_key=${widgetKey}`, { credentials: 'include' })
    const data = await res.json()
    setPendingComments(data)
  }

  async function fetchDeleted(widgetKey: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/deleted?widget_key=${widgetKey}`, { credentials: 'include' })
    const data = await res.json()
    setDeletedComments(data)
  }

  async function handleDelete(commentId: string, parentId?: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c
        ))
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    }
  }

  async function handleApprove(commentId: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/approve`, {
      method: 'PATCH',
      credentials: 'include',
    })
    if (res.ok) {
      setPendingComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  async function handleReject(commentId: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setPendingComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  async function handleRestore(commentId: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/restore`, {
      method: 'PATCH',
      credentials: 'include',
    })
    if (res.ok) {
      setDeletedComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  async function handlePermanentDelete(commentId: string) {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/permanent`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (res.ok) {
      setDeletedComments(prev => prev.filter(c => c.id !== commentId))
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div>Loading...</div>
  if (!widget || !site) return <div>Not found</div>

  const scriptTag = `<script src="${import.meta.env.VITE_WIDGET_URL}/widget.js" data-widget-key="${widget.widgetKey}" data-widget="comments"></script>`

  return (
    <div>
      <Navbar />
      <SubNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="sc-container">
        <div className="sc-breadcrumb">
          <span className="sc-breadcrumb-link" onClick={() => navigate('/dashboard')}>Sites</span>
          <span className="sc-breadcrumb-sep">/</span>
          <span className="sc-breadcrumb-link" onClick={() => navigate(`/dashboard/sites/${siteId}`)}>{site.name}</span>
          <span className="sc-breadcrumb-sep">/</span>
          <span className="sc-breadcrumb-current">{widget.name}</span>
        </div>

        <div className="sc-script-block">
          <div className="sc-script-header">
            <span className="sc-script-label">Script tag</span>
            <button className="sc-btn" onClick={() => handleCopy(scriptTag)}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="sc-script-code">{scriptTag}</pre>
        </div>

        {activeTab === 'comments' && (
          <CommentsTab
            comments={comments}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onDelete={handleDelete}
            onLoadMore={() => {
              if (!widget || !cursor) return
              setLoadingMore(true)
              fetchComments(widget.widgetKey, cursor)
            }}
          />
        )}
        {activeTab === 'pending' && (
          <PendingTab
            comments={pendingComments}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {activeTab === 'deleted' && (
          <DeletedTab
            comments={deletedComments}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
          />
        )}
      </div>
    </div>
  )
}

export default SiteComments
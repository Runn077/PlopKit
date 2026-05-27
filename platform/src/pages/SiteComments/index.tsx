import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SubNav from './SubNav'
import CommentsTab from './tabs/CommentsTab'
import PendingTab from './tabs/PendingTab'
import DeletedTab from './tabs/DeletedTab'
import WordFilterTab from './tabs/WordFilterTab'
import './SiteComments.css'
import type { Comment, Widget, Site, Reply } from '../../types'
import { apiFetch } from '../../lib/api'

type Tab = 'comments' | 'pending' | 'deleted' | 'filter'

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
  const [orphanedReplies, setOrphanedReplies] = useState<Reply[]>([])
  const [orphanedDeletedReplies, setOrphanedDeletedReplies] = useState<Reply[]>([])
  const [error, setError] = useState('')

  useEffect(() => { fetchData() }, [widgetId])

  useEffect(() => {
    if (!widget) return
    if (activeTab === 'pending') fetchPending(widget.widgetKey)
    if (activeTab === 'deleted') fetchDeleted(widget.widgetKey)
  }, [activeTab, widget])

  async function fetchData() {
    try {
      setError('')
      const [widgetRes, siteRes] = await Promise.all([
        apiFetch(`/widgets/single/${widgetId}`),
        apiFetch(`/sites/${siteId}`),
      ])
      if (!widgetRes.ok) throw new Error('Failed to load widget')
      if (!siteRes.ok) throw new Error('Failed to load site')
      const widgetData = await widgetRes.json()
      const siteData = await siteRes.json()
      setWidget(widgetData)
      setSite(siteData)
      fetchComments(widgetData.widgetKey)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setLoading(false)
    }
  }

  async function fetchComments(widgetKey: string, cursor?: string) {
    const params = new URLSearchParams({ widget_key: widgetKey })
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments?${params}`)
    const data = await res.json()
    setComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    setHasMore(data.hasMore)
    if (data.comments.length > 0) setCursor(data.comments[data.comments.length - 1].id)
    setLoading(false)
    setLoadingMore(false)
  }

  async function fetchPending(widgetKey: string) {
    const res = await apiFetch(`/comments/pending?widget_key=${widgetKey}`)
    const data = await res.json()
    setPendingComments(data.comments)
    setOrphanedReplies(data.orphanedReplies)
  }

  async function fetchDeleted(widgetKey: string) {
    const res = await apiFetch(`/comments/deleted?widget_key=${widgetKey}`)
    const data = await res.json()
    setDeletedComments(data.comments)
    setOrphanedDeletedReplies(data.orphanedReplies)
  }

  async function handleDelete(commentId: string, parentId?: string) {
    const res = await apiFetch(`/comments/${commentId}`, {
      method: 'DELETE',
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
    const res = await apiFetch(`/comments/${commentId}/approve`, { method: 'PATCH' })
    if (res.ok) {
      const approved = pendingComments.find(c => c.id === commentId)
      setPendingComments(prev => prev.filter(c => c.id !== commentId))
      setOrphanedReplies(prev => prev.filter(r => r.id !== commentId))
      if (approved) {
        setComments(prev => [approved, ...prev])
      }
    }
  }
  async function handleReject(commentId: string) {
    const res = await apiFetch(`/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      setPendingComments(prev => prev.filter(c => c.id !== commentId))
      setOrphanedReplies(prev => prev.filter(r => r.id !== commentId))
    }
  }

  async function handleRestore(commentId: string) {
    const res = await apiFetch(`/comments/${commentId}/restore`, { method: 'PATCH' })
    if (res.ok) {
      const restored = deletedComments.find(c => c.id === commentId)
      setDeletedComments(prev => prev.filter(c => c.id !== commentId))
      if (restored) {
        setComments(prev => [{ ...restored, deletedAt: null }, ...prev])
      }
    }
  }

  async function handlePermanentDelete(commentId: string) {
    const res = await apiFetch(`/comments/${commentId}/permanent`, {
      method: 'DELETE',
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

  async function handleApproveReply(replyId: string, parentId: string) {
    const res = await apiFetch(`/comments/${replyId}/approve`, { method: 'PATCH' })
    if (res.ok) {
      const parentComment = pendingComments.find(c => c.id === parentId)
      const approvedReply = parentComment?.replies.find(r => r.id === replyId)
        ?? orphanedReplies.find(r => r.id === replyId)
      setPendingComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== replyId) } : c
      ))
      setOrphanedReplies(prev => prev.filter(r => r.id !== replyId))
      if (approvedReply) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: [...c.replies, approvedReply] } : c
        ))
      }
    }
  }

  async function handleRejectReply(replyId: string, parentId: string) {
    const res = await apiFetch(`/comments/${replyId}`, { method: 'DELETE' })
    if (res.ok) {
      setPendingComments(prev => prev.map(c =>
        c.id === parentId
          ? { ...c, replies: c.replies.filter(r => r.id !== replyId) }
          : c
      ))
      setOrphanedReplies(prev => prev.filter(r => r.id !== replyId))
    }
  }

  async function handleRestoreReply(replyId: string) {
    const res = await apiFetch(`/comments/${replyId}/restore`, { method: 'PATCH' })
    if (res.ok) {
      const restoredReply = orphanedDeletedReplies.find(r => r.id === replyId)
      setOrphanedDeletedReplies(prev => prev.filter(r => r.id !== replyId))
      if (restoredReply) {
        setComments(prev => prev.map(c =>
          c.id === restoredReply.parentId
            ? { ...c, replies: [...c.replies, { ...restoredReply, deletedAt: null }] }
            : c
        ))
      }
    }
  }

  async function handlePermanentDeleteReply(replyId: string) {
    const res = await apiFetch(`/comments/${replyId}/permanent`, { method: 'DELETE' })
    if (res.ok) {
      setOrphanedDeletedReplies(prev => prev.filter(r => r.id !== replyId))
    }
  }

  async function handleToggleAutoApprove(value: boolean) {
    if (!widget) return
    const res = await apiFetch(`/widgets/${widget.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ autoApprove: value }),
    })
    if (res.ok) {
      setWidget(prev => prev?.commentWidget
        ? { ...prev, commentWidget: { ...prev.commentWidget, autoApprove: value } }
        : prev
      )
    }
  }

  async function handleDeleteAll() {
    if (!widget) return
    const res = await apiFetch(`/comments/deleteAll?widget_key=${widget.widgetKey}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setDeletedComments([])
      setOrphanedDeletedReplies([])
    }
  }

  async function handleUpdateBannedWords(bannedWords: string[], autoDelete: boolean) {
    if (!widget) return
    const res = await apiFetch(`/widgets/${widget.id}/banned-words`, {
      method: 'PATCH',
      body: JSON.stringify({ bannedWords, autoDeleteBannedWords: autoDelete }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Something went wrong')
    }
    const updated = await res.json()
    setWidget(prev => prev?.commentWidget
      ? { ...prev, commentWidget: { ...prev.commentWidget, bannedWords: updated.bannedWords, autoDeleteBannedWords: updated.autoDeleteBannedWords } }
      : prev
    )
  }

  function handleReplyPosted(commentId: string, reply: Reply) {
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, replies: [...c.replies, reply] }
        : { ...c, replies: c.replies.map(r => r.id === commentId
            ? { ...r }
            : r
          )
        }
    ))
  }

  async function handleOwnerPost(body: string) {
    if (!widget) return
    const res = await apiFetch('/comments/owner-post', {
      method: 'POST',
      body: JSON.stringify({
        widget_key: widget.widgetKey,
        page_url: `https://${widget.widgetKey}`,
        body,
      }),
    })
    if (res.ok) {
      const newComment = await res.json()
      setComments(prev => [{ ...newComment, replies: [] }, ...prev])
    }
  }

  async function handlePin(commentId: string) {
    const res = await apiFetch(`/comments/${commentId}/pin`, { method: 'PATCH' })
    if (res.ok) {
      setWidget(prev => prev?.commentWidget
        ? { ...prev, commentWidget: { ...prev.commentWidget, pinnedCommentId: commentId } }
        : prev
      )
    }
  }

  async function handleUnpin() {
    if (!widget) return
    const res = await apiFetch(`/comments/unpin?widget_key=${widget.widgetKey}`, { method: 'PATCH' })
    if (res.ok) {
      setWidget(prev => prev?.commentWidget
        ? { ...prev, commentWidget: { ...prev.commentWidget, pinnedCommentId: null } }
        : prev
      )
    }
  }

  if (loading) return <div className="page-loading">Loading...</div>
  if (error) return (
    <div>
      <Navbar />
      <div className="page-error">
        <p className="page-error-message">{error}</p>
        <button className="page-error-retry" onClick={fetchData}>Try again</button>
      </div>
    </div>
  )
  if (!widget || !site) return <div>Not found</div>

  const scriptTag = `<script src="${import.meta.env.VITE_APP_URL}/widget.js" data-widget-key="${widget.widgetKey}" data-widget="comments"></script>`

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
            pinnedCommentId={widget.commentWidget?.pinnedCommentId ?? null}
            onDelete={handleDelete}
            onReplyPosted={handleReplyPosted}
            onPin={handlePin}
            onUnpin={handleUnpin}
            onOwnerPost={handleOwnerPost}
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
            orphanedReplies={orphanedReplies}
            autoApprove={widget.commentWidget?.autoApprove ?? false}
            onApprove={handleApprove}
            onReject={handleReject}
            onApproveReply={handleApproveReply}
            onRejectReply={handleRejectReply}
            onToggleAutoApprove={handleToggleAutoApprove}
          />
        )}
        {activeTab === 'deleted' && (
          <DeletedTab
            comments={deletedComments}
            orphanedReplies={orphanedDeletedReplies}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onRestoreReply={handleRestoreReply}
            onPermanentDeleteReply={handlePermanentDeleteReply}
            onDeleteAll={handleDeleteAll}
          />
        )}
        {activeTab === 'filter' && (
          <WordFilterTab
            bannedWords={widget.commentWidget?.bannedWords ?? []}
            autoDelete={widget.commentWidget?.autoDeleteBannedWords ?? false}
            onSave={handleUpdateBannedWords}
          />
        )}
      </div>
    </div>
  )
}

export default SiteComments
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import SubNav from '../../components/SubNav'
import CommentsTab from './tabs/CommentsTab'
import PendingTab from './tabs/PendingTab'
import DeletedTab from './tabs/DeletedTab'
import WordFilterTab from './tabs/WordFilterTab'
import './SiteComments.css'
import type { Comment, Widget, Site, Reply } from '../../types'
import { apiFetch } from '../../lib/api'
import Footer from '../../components/Footer'

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
  const [pendingHasMore, setPendingHasMore] = useState(false)
  const [pendingCursor, setPendingCursor] = useState<string | null>(null)
  const [loadingMorePending, setLoadingMorePending] = useState(false)
  const [deletedHasMore, setDeletedHasMore] = useState(false)
  const [deletedCursor, setDeletedCursor] = useState<string | null>(null)
  const [loadingMoreDeleted, setLoadingMoreDeleted] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [commentTotal, setCommentTotal] = useState(0)
  const [cursor, setCursor] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [copied, setCopied] = useState(false)
  const [orphanedReplies, setOrphanedReplies] = useState<Reply[]>([])
  const [orphanedDeletedReplies, setOrphanedDeletedReplies] = useState<Reply[]>([])
  const [error, setError] = useState('')
  const [pinnedComment, setPinnedComment] = useState<Comment | null>(null)

  useEffect(() => { fetchData() }, [widgetId])

  useEffect(() => {
    if (!widget) return
    if (activeTab === 'pending') {
      setPendingComments([])
      setPendingCursor(null)
      fetchPending(widget.widgetKey)
    }
    if (activeTab === 'deleted') {
      setDeletedComments([])
      setDeletedCursor(null)
      fetchDeleted(widget.widgetKey)
    }
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
    const res = await apiFetch(`/comments/approved?${params}`)
    const data = await res.json()
    if (!cursor) setPinnedComment(data.pinnedComment ?? null)
    setComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    setHasMore(data.hasMore)
    if (!cursor) setCommentTotal(data.total ?? data.comments.length)
    if (data.comments.length > 0) setCursor(data.comments[data.comments.length - 1].id)
    setLoading(false)
    setLoadingMore(false)
  }

  async function fetchPending(widgetKey: string, cursor?: string) {
    const params = new URLSearchParams({ widget_key: widgetKey })
    if (cursor) params.set('cursor', cursor)
    const res = await apiFetch(`/comments/pending?${params}`)
    const data = await res.json()
    setPendingComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    if (!cursor) setOrphanedReplies(data.orphanedReplies)
    setPendingHasMore(data.hasMore)
    setPendingCursor(data.nextCursor ?? null)
    setLoadingMorePending(false)
  }

  async function fetchDeleted(widgetKey: string, cursor?: string) {
    const params = new URLSearchParams({ widget_key: widgetKey })
    if (cursor) params.set('cursor', cursor)
    const res = await apiFetch(`/comments/deleted?${params}`)
    const data = await res.json()
    setDeletedComments(prev => cursor ? [...prev, ...data.comments] : data.comments)
    if (!cursor) setOrphanedDeletedReplies(data.orphanedReplies)
    setDeletedHasMore(data.hasMore)
    setDeletedCursor(data.nextCursor ?? null)
    setLoadingMoreDeleted(false)
  }

  async function handleDelete(commentId: string, parentId?: string) {
    const res = await apiFetch(`/comments/${commentId}`, { method: 'DELETE' })
    if (res.ok) {
      if (parentId) {
        setComments(prev => prev.map(c =>
          c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c
        ))
        if (pinnedComment?.id === parentId) {
          setPinnedComment(prev => prev ? { ...prev, replies: prev.replies.filter(r => r.id !== commentId) } : null)
        }
        setCommentTotal(prev => Math.max(0, prev - 1))
      } else {
        if (pinnedComment?.id === commentId) {
          const removedCount = 1 + (pinnedComment.replies.length ?? 0)
          setPinnedComment(null)
          setWidget(prev => prev?.commentWidget
            ? { ...prev, commentWidget: { ...prev.commentWidget, pinnedCommentId: null } }
            : prev
          )
          setCommentTotal(prev => Math.max(0, prev - removedCount))
        } else {
          const deleted = comments.find(c => c.id === commentId)
          const removedCount = 1 + (deleted?.replies.length ?? 0)
          setComments(prev => prev.filter(c => c.id !== commentId))
          setCommentTotal(prev => Math.max(0, prev - removedCount))
        }
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
    const res = await apiFetch(`/comments/${widget.id}/auto-approve`, {
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
    const res = await apiFetch(`/comments/${widget.id}/banned-words`, {
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
        : c
    ))
    setCommentTotal(prev => prev + 1)
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
      setCommentTotal(prev => prev + 1)
    }
  }

  async function handlePin(commentId: string) {
    const res = await apiFetch(`/comments/${commentId}/pin`, { method: 'PATCH' })
    if (res.ok) {
      const target = comments.find(c => c.id === commentId) ?? null
      setPinnedComment(target)
      setComments(prev => prev.filter(c => c.id !== commentId))
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
      if (pinnedComment) {
        setComments(prev => [pinnedComment, ...prev])
      }
      setPinnedComment(null)
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

  const scriptTag = `<script src="${import.meta.env.VITE_APP_URL}/widget.js" data-widget-key="${widget.widgetKey}"></script>`

  return (
    <div>
      <Navbar />
      <SubNav
        tabs={[
          { id: 'comments', label: 'Comments' },
          { id: 'pending', label: 'Pending' },
          { id: 'deleted', label: 'Recently Deleted' },
          { id: 'filter', label: 'Filter' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as Tab)}
      />
      <div className="sc-breadcrumb">
        <span className="sc-breadcrumb-link" onClick={() => navigate('/dashboard')}>Sites</span>
        <span className="sc-breadcrumb-sep">/</span>
        <span className="sc-breadcrumb-link" onClick={() => navigate(`/dashboard/sites/${siteId}`)}>{site.name}</span>
        <span className="sc-breadcrumb-sep">/</span>
        <span className="sc-breadcrumb-current">{widget.name}</span>
      </div>
      <div className="sc-container">
        <div className="sc-script-block">
          <div className="sc-script-header">
            <span className="sc-script-label">Script tag</span>
            <div className="sc-script-header-right">
              <span className="sc-script-loads">
                loads this month: {(widget.monthlyLoads ?? 0).toLocaleString()}
              </span>
              <button className="sc-btn" onClick={() => handleCopy(scriptTag)}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <pre className="sc-script-code">{scriptTag}</pre>
        </div>

        {activeTab === 'comments' && (
          <CommentsTab
            pinnedComment={pinnedComment}
            comments={comments}
            total={commentTotal}
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
            hasMore={pendingHasMore}
            loadingMore={loadingMorePending}
            onApprove={handleApprove}
            onReject={handleReject}
            onApproveReply={handleApproveReply}
            onRejectReply={handleRejectReply}
            onToggleAutoApprove={handleToggleAutoApprove}
            onLoadMore={() => {
              if (!widget || !pendingCursor) return
              setLoadingMorePending(true)
              fetchPending(widget.widgetKey, pendingCursor)
            }}
          />
        )}
        {activeTab === 'deleted' && (
          <DeletedTab
            comments={deletedComments}
            orphanedReplies={orphanedDeletedReplies}
            hasMore={deletedHasMore}
            loadingMore={loadingMoreDeleted}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDelete}
            onRestoreReply={handleRestoreReply}
            onPermanentDeleteReply={handlePermanentDeleteReply}
            onDeleteAll={handleDeleteAll}
            onLoadMore={() => {
              if (!widget || !deletedCursor) return
              setLoadingMoreDeleted(true)
              fetchDeleted(widget.widgetKey, deletedCursor)
            }}
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
      <Footer/>
    </div>
  )
}

export default SiteComments
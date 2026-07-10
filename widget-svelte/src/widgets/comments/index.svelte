<script lang="ts">
  import { onMount } from 'svelte'
  import CommentItem from './CommentItem.svelte'
  import type { Comment, CommentsResponse, NewComment, BaseWidgetProps } from '../../types'
  import { Toast } from './toast.svelte'
  import styles from './comments.css?inline'

  let { widgetKey, pageUrl, shadowRoot }: BaseWidgetProps = $props()

  let comments = $state<Comment[]>([])
  let hasMore = $state(false)
  let loading = $state(false)
  let body = $state('')
  let authorName = $state('')
  let total = $state(0)
  let pinnedCommentId = $state<string | null>(null)
  let limitReached = $state(false)
  let pinnedComment = $state<Comment | null>(null)
  let secret = $state<string | null>(null)
  let ownDisplayId = $state<string | null>(null)

  const STORAGE_KEY = $derived(`plopkit_author_${widgetKey}`)
  const SECRET_KEY = 'plopkit_commenter_secret'
  const toast = new Toast()

  function loadSavedName() {
    try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' }
  }

  function saveName(name: string) {
    try {
      if (name.trim()) {
        localStorage.setItem(STORAGE_KEY, name.trim())
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }

  function loadOrCreateSecret(): string {
    try {
      const existing = localStorage.getItem(SECRET_KEY)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (existing && uuidRegex.test(existing)) return existing
      const newSecret = crypto.randomUUID()
      localStorage.setItem(SECRET_KEY, newSecret)
      return newSecret
    } catch {
      return crypto.randomUUID()
    }
  }

  async function fetchComments(cursor?: string) {
    loading = true
    const url = `${import.meta.env.VITE_API_URL}/public/comments?widget_key=${widgetKey}&page_url=${encodeURIComponent(pageUrl)}${cursor ? `&cursor=${cursor}` : ''}`
    const res = await fetch(url)
    if (res.status === 429) {
      limitReached = true
      loading = false
      return
    }
    const data: CommentsResponse = await res.json()
    if (!cursor) {
      pinnedComment = data.pinnedComment
      pinnedCommentId = data.pinnedCommentId
    }
    comments = cursor ? [...comments, ...data.comments] : data.comments
    hasMore = data.hasMore
    total = data.total ?? (cursor ? total : data.comments.length)
    loading = false
  }

  function loadMore() {
    const last = comments[comments.length - 1]
    if (last) fetchComments(last.id)
  }

  async function postComment() {
    if (!body.trim()) return
    const nameToSend = authorName.trim() || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body,
        author_name: nameToSend || undefined,
        commenter_secret: secret ?? undefined,
      }),
    })
    const data: NewComment = await res.json()
    if (!res.ok) {
      toast.show((data as any).error || 'Failed to post comment')
      return
    }
    saveName(nameToSend)
    body = ''
    if (data.status === 'approved') {
      comments = [{ ...data, replies: [] }, ...comments]
      total += 1
      toast.show('Comment posted!')
    } else {
      toast.show('Your comment has been submitted and is awaiting approval.')
    }
  }


  async function computeDisplayId(secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(secret)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const base64 = btoa(String.fromCharCode(...hashArray))
    return base64.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  }

  onMount(async () => {
    const styleEl = document.createElement('style')
    styleEl.textContent = styles
    shadowRoot.insertBefore(styleEl, shadowRoot.firstChild)
    authorName = loadSavedName()
    secret = loadOrCreateSecret()
    ownDisplayId = await computeDisplayId(secret)
    fetchComments()
  })
</script>

<div class="widget">
  {#if limitReached}
    <p class="empty">Comments are temporarily unavailable.</p>
  {:else}
    <h3>{total} {total === 1 ? 'Comment' : 'Comments'}</h3>
    <div class="input-area">
      <input
        class="author-input"
        bind:value={authorName}
        maxlength={30}
        placeholder="Name (optional)"
      />
      <textarea
        bind:value={body}
        maxlength={2500}
        placeholder="Add a comment..."
      ></textarea>
      <div class="input-actions">
        <span class="char-count">{body.length}/2500</span>
        <button class="btn-post" onclick={postComment} disabled={!body.trim()}>
          Post
        </button>
      </div>
    </div>
    {#if toast.message}
      <div class="toast {toast.fading ? 'toast-fade-out' : ''}">{toast.message}</div>
    {/if}
    <div class="comments-list">
      {#if comments.length === 0 && !pinnedComment && !loading}
        <p class="empty">No comments yet. Be the first!</p>
      {/if}
      {#if pinnedComment}
        <CommentItem
          comment={pinnedComment}
          {widgetKey}
          {pageUrl}
          isPinned={true}
          commenterSecret={secret}
          onDeleted={() => { pinnedComment = null; total -= 1 }}
          ownDisplayId={ownDisplayId}
        />
      {/if}
      {#each comments as c (c.id)}
        <CommentItem
          comment={c}
          {widgetKey}
          {pageUrl}
          isPinned={false}
          commenterSecret={secret}
          onDeleted={(id) => { comments = comments.filter(x => x.id !== id); total -= 1 }}
          ownDisplayId={ownDisplayId}
        />
      {/each}
      {#if hasMore}
        <button class="btn-load-more" onclick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load more'}
        </button>
      {/if}
    </div>
  {/if}
  <div class="powered-by">
    <a href="https://plopkit.com" target="_blank" rel="noopener noreferrer">Powered by PlopKit</a>
  </div>
</div>
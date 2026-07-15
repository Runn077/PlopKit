<script lang="ts">
  import { onMount } from 'svelte'
  import InputArea from './InputArea.svelte'
  import CommentItem from './CommentItem.svelte'
  import type { Comment, CommentsResponse, NewComment, BaseWidgetProps } from '../../types'
  import styles from './comments.css?inline'
  import sharedStyles from './shared.css?inline'
  import inputAreaStyles from './InputArea.css?inline'
  import commentItemStyles from './CommentItem.css?inline'
  import replyItemStyles from './ReplyItem.css?inline'

  let { widgetKey, pageUrl, shadowRoot, theme }: BaseWidgetProps = $props()

  let comments = $state<Comment[]>([])
  let hasMore = $state(false)
  let loading = $state(false)
  let total = $state(0)
  let pinnedCommentId = $state<string | null>(null)
  let limitReached = $state(false)
  let pinnedComment = $state<Comment | null>(null)
  let secret = $state<string | null>(null)
  let ownDisplayId = $state<string | null>(null)

  const SECRET_KEY = 'plopkit_commenter_secret'

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

  function handleCommentPosted(data: NewComment, status: string) {
    if (status === 'approved') {
      comments = [{ ...data, replies: [] }, ...comments]
      total += 1
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

  function applyTheme() {
    if (!theme?.tokens) return
    const host = shadowRoot.host as HTMLElement
    for (const [key, value] of Object.entries(theme.tokens)) {
      const cssVar = '--pkw-' + key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      host.style.setProperty(cssVar, value as string)
    }
  }

  function injectStyles() {
    const allStyles = [sharedStyles, styles, inputAreaStyles, commentItemStyles, replyItemStyles]
    for (const css of allStyles) {
      const el = document.createElement('style')
      el.textContent = css
      shadowRoot.appendChild(el)
    }
  }

  onMount(async () => {
    injectStyles()
    applyTheme()
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

    <InputArea
      {widgetKey}
      {pageUrl}
      {secret}
      onPosted={handleCommentPosted}
    />

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
          {ownDisplayId}
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
          {ownDisplayId}
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
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
  let total = $state(0)
  let pinnedCommentId = $state<string | null>(null)
  const toast = new Toast()

  async function fetchComments(cursor?: string) {
    loading = true
    const url = `${import.meta.env.VITE_API_URL}/public/comments?widget_key=${widgetKey}&page_url=${encodeURIComponent(pageUrl)}${cursor ? `&cursor=${cursor}` : ''}`
    const data: CommentsResponse = await fetch(url).then(r => r.json())
    comments = cursor ? [...comments, ...data.comments] : data.comments
    hasMore = data.hasMore
    total = data.total ?? (cursor ? total : data.comments.length)
    if (!cursor) pinnedCommentId = data.pinnedCommentId
    loading = false
  }

  function loadMore() {
    const last = comments[comments.length - 1]
    if (last) fetchComments(last.id)
  }

  async function postComment() {
    if (!body.trim()) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widget_key: widgetKey, page_url: pageUrl, body }),
    })

    const data: NewComment = await res.json()

    if (!res.ok) {
      toast.show((data as any).error || 'Failed to post comment')
      return
    }

    body = ''

    if (data.status === 'approved') {
      comments = [{ ...data, replies: [] }, ...comments]
      total += 1
      toast.show('Comment posted!')
    } else {
      toast.show('Your comment has been submitted and is awaiting approval.')
    }
  }

  onMount(() => {
    const styleEl = document.createElement('style')
    styleEl.textContent = styles
    shadowRoot.insertBefore(styleEl, shadowRoot.firstChild)
    fetchComments()
  })
</script>

<div class="widget">
  <h3>{total} {total === 1 ? 'Comment' : 'Comments'}</h3>
  <div class="input-area">
    <textarea
      bind:value={body}
      maxlength={1000}
      placeholder="Add a comment..."
    ></textarea>
    <div class="input-actions">
      <span class="char-count">{body.length}/1000</span>
      <button class="btn-post" onclick={postComment} disabled={!body.trim()}>
        Post
      </button>
    </div>
  </div>
  {#if toast.message}
    <div class="toast {toast.fading ? 'toast-fade-out' : ''}">{toast.message}</div>
  {/if}
  <div class="comments-list">
    {#if comments.length === 0 && !loading}
      <p class="empty">No comments yet. Be the first!</p>
    {/if}
    {#each comments as c (c.id)}
      <CommentItem
        comment={c}
        {widgetKey}
        {pageUrl}
        isPinned={pinnedCommentId === c.id}
      />
    {/each}
    {#if hasMore}
      <button class="btn-load-more" onclick={loadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load more'}
      </button>
    {/if}
  </div>
</div>
<script lang="ts">
  import ReplyItem from './ReplyItem.svelte'
  import type { Comment, Reply } from '../../types'
  import { Toast } from './toast.svelte'

  interface Props {
    comment: Comment
    widgetKey: string
    pageUrl: string
    isPinned: boolean
  }

  let { comment, widgetKey, pageUrl, isPinned }: Props = $props()

  let replies = $state<Reply[]>([...comment.replies])
  let expanded = $state(false)
  let showReplies = $state(false)
  let replyOpen = $state(false)
  let replyBody = $state('')
  let replyAuthorName = $state('')
  const toast = new Toast()

  const STORAGE_KEY = `plopkit_author_${widgetKey}`

  const LIMIT = 1000
  const MAX_LINES = 3

  const lines = $derived(comment.body.split('\n'))
  const isLong = $derived(comment.body.length > LIMIT || lines.length > MAX_LINES)
  const displayBody = $derived(
    expanded || !isLong
      ? comment.body
      : lines.length > MAX_LINES
        ? lines.slice(0, MAX_LINES).join('\n') + '...'
        : comment.body.slice(0, LIMIT) + '...'
  )

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

  function openReply() {
    replyAuthorName = loadSavedName()
    replyOpen = true
  }

  function handleReplyPosted(reply: Reply) {
    replies = [...replies, reply]
    showReplies = true
  }

  async function postReply() {
    if (!replyBody.trim()) return
    const nameToSend = replyAuthorName.trim() || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body: replyBody,
        parent_id: comment.id,
        author_name: nameToSend || undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.show(data.error || 'Failed to post reply')
      return
    }

    saveName(nameToSend)
    replyBody = ''
    replyOpen = false
    showReplies = true

    if (data.status === 'approved') {
      replies = [...replies, {
        id: data.id,
        body: data.body,
        authorName: data.authorName,
        createdAt: data.createdAt,
        quotedId: null,
        quoted: null,
        isOwnerReply: false,
      }]
      toast.show('Reply posted!')
    } else {
      toast.show('Your reply has been submitted and is awaiting approval.')
    }
  }
</script>

<div class="comment {isPinned ? 'comment-pinned' : ''}">
  {#if isPinned || comment.isOwnerReply}
    <div style="display:flex;gap:6px;margin-bottom:6px">
      {#if isPinned}<span class="pinned-badge">Pinned</span>{/if}
      {#if comment.isOwnerReply}<span class="owner-badge">Site owner</span>{/if}
    </div>
  {/if}
  <span class="comment-author">{comment.authorName}</span>
  <p class="comment-body">{displayBody}</p>
  {#if isLong}
    <button class="btn-show-more" onclick={() => expanded = !expanded}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  {/if}
  <div class="comment-meta">
    <span class="comment-time">{new Date(comment.createdAt).toLocaleString()}</span>
    <div class="comment-actions">
      <button class="btn-reply" onclick={() => replyOpen ? (replyOpen = false) : openReply()}>
        {replyOpen ? 'Cancel' : 'Reply'}
      </button>
    </div>
  </div>
  {#if replyOpen}
    <div class="reply-input-area">
      <input
        class="author-input"
        bind:value={replyAuthorName}
        maxlength={50}
        placeholder="Name (optional)"
      />
      <textarea
        bind:value={replyBody}
        maxlength={1000}
        placeholder="Add a reply..."
      ></textarea>
      <div class="reply-actions">
        <span class="char-count">{replyBody.length}/1000</span>
        <div style="display:flex;gap:8px">
          <button class="btn-cancel" onclick={() => { replyOpen = false; replyBody = '' }}>
            Cancel
          </button>
          <button class="btn-post-reply" onclick={postReply} disabled={!replyBody.trim()}>
            Reply
          </button>
        </div>
      </div>
    </div>
  {/if}
  {#if toast.message}
    <div class="toast {toast.fading ? 'toast-fade-out' : ''}">{toast.message}</div>
  {/if}
  {#if replies.length > 0}
    <button class="btn-show-replies" onclick={() => showReplies = !showReplies}>
      {showReplies ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
    </button>
    {#if showReplies}
      <div class="replies">
        {#each replies as r (r.id)}
          <ReplyItem
            reply={r}
            {widgetKey}
            {pageUrl}
            parentId={comment.id}
            onReplyPosted={handleReplyPosted}
          />
        {/each}
      </div>
    {/if}
  {/if}
</div>
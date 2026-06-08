<script lang="ts">
  import type { Reply } from '../../types'
  import { Toast } from './toast.svelte'
  import { timeAgo } from './timeago';

  interface Props {
    reply: Reply
    widgetKey: string
    pageUrl: string
    parentId: string
    onReplyPosted: (reply: Reply) => void
  }

  let { reply, widgetKey, pageUrl, parentId, onReplyPosted }: Props = $props()

  let replyOpen = $state(false)
  let replyBody = $state('')
  let replyAuthorName = $state('')
  const toast = new Toast()

  const STORAGE_KEY = `plopkit_author_${widgetKey}`

  const isQuoteDeleted = $derived(
    reply.quoted && (reply.quoted.deletedAt !== null || reply.quoted.status !== 'approved')
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
        parent_id: parentId,
        quoted_id: reply.id,
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
    if (data.status === 'approved') {
      onReplyPosted({
        id: data.id,
        body: data.body,
        authorName: data.authorName,
        createdAt: data.createdAt,
        quotedId: data.quotedId,
        quoted: data.quoted,
        isOwnerReply: false,
      })
      toast.show('Reply posted!')
    } else {
      toast.show('Your reply has been submitted and is awaiting approval.')
    }
  }
</script>

<div class="reply">
  {#if reply.isOwnerReply}
    <span class="owner-badge">Site owner</span>
  {/if}
  {#if reply.quoted}
    <div class="quoted-comment">
      <p class="quoted-body">
        {isQuoteDeleted ? 'Deleted message' : reply.quoted.body}
      </p>
    </div>
  {/if}
  <span class="reply-author">{reply.authorName}</span>
  <p class="reply-body">{reply.body}</p>
  <div class="reply-meta">
    <span class="comment-time">{timeAgo(reply.createdAt)}</span>
    <button class="btn-reply" onclick={() => replyOpen ? (replyOpen = false) : openReply()}>
      {replyOpen ? 'Cancel' : 'Reply'}
    </button>
  </div>
  {#if replyOpen}
    <div class="reply-input-area">
      <div class="quoted-preview">
        <p class="quoted-preview-body">{reply.body}</p>
      </div>
      <input
        class="author-input"
        bind:value={replyAuthorName}
        maxlength={50}
        placeholder="Name (optional)"
      />
      <textarea
        bind:value={replyBody}
        maxlength={2500}
        placeholder="Add a reply..."
      ></textarea>
      <div class="reply-actions">
        <span class="char-count">{replyBody.length}/2500</span>
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
</div>
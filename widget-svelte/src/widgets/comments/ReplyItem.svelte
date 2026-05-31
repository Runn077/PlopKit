<script lang="ts">
  import type { Reply } from '../../types'
  import { Toast } from './toast.svelte'

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
  const toast = new Toast()

  const isQuoteDeleted = $derived(
    reply.quoted && (reply.quoted.deletedAt !== null || reply.quoted.status !== 'approved')
  )

  async function postReply() {
    if (!replyBody.trim()) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body: replyBody,
        parent_id: parentId,
        quoted_id: reply.id,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.show(data.error || 'Failed to post reply')
      return
    }

    replyBody = ''
    replyOpen = false

    if (data.status === 'approved') {
      onReplyPosted({
        id: data.id,
        body: data.body,
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
  <p class="reply-body">{reply.body}</p>
  <div class="reply-meta">
    <span class="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
    <button class="btn-reply" onclick={() => replyOpen = !replyOpen}>
      {replyOpen ? 'Cancel' : 'Reply'}
    </button>
  </div>
  {#if replyOpen}
    <div class="reply-input-area">
      <div class="quoted-preview">
        <p class="quoted-preview-body">{reply.body}</p>
      </div>
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
</div>
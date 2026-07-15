<script lang="ts">
  import type { Reply } from '../../types'
  import { Toast } from './toast.svelte'
  import { timeAgo } from './timeago'
  import { getTruncatedBody } from './truncate'

  interface Props {
    reply: Reply
    widgetKey: string
    pageUrl: string
    parentId: string
    commenterSecret: string | null
    onReplyPosted: (reply: Reply) => void
    onDeleted: (replyId: string) => void
    ownDisplayId: string | null
  }

  let { reply, widgetKey, pageUrl, parentId, commenterSecret, onReplyPosted, onDeleted, ownDisplayId }: Props = $props()

  let replyOpen = $state(false)
  let replyBody = $state('')
  let replyAuthorName = $state('')
  let expanded = $state(false)
  const toast = new Toast()

  const STORAGE_KEY = $derived(`plopkit_author_${widgetKey}`)
  const truncated = $derived(getTruncatedBody(reply.body, expanded))

  const isQuoteDeleted = $derived(
    reply.quoted && (reply.quoted.deletedAt !== null || reply.quoted.status !== 'approved')
  )

  const isOwn = $derived(
    !!ownDisplayId &&
    reply.commenterDisplayId === ownDisplayId &&
    !reply.isOwnerReply
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

  async function deleteReply() {
    if (!commenterSecret) return
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: reply.id, commenter_secret: commenterSecret }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.show(data.error || 'Failed to delete reply')
      return
    }
    onDeleted(reply.id)
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
        commenter_secret: commenterSecret ?? undefined,
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
        commenterDisplayId: data.commenterDisplayId,
      })
      toast.show('Reply posted!')
    } else {
      toast.show('Your reply has been submitted and is awaiting approval.')
    }
  }

  function scrollToQuoted(e: MouseEvent) {
    if (isQuoteDeleted || !reply.quotedId) return

    const root = (e.currentTarget as HTMLElement).getRootNode() as ShadowRoot | Document
    const target = root.getElementById(`comment-${reply.quotedId}`)

    if (!target) return

    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target.classList.add('quoted-highlight')
    setTimeout(() => target.classList.remove('quoted-highlight'), 1600)
  }
</script>

<div class="reply" id={`comment-${reply.id}`}>
  {#if reply.isOwnerReply}
    <span class="owner-badge">Owner</span>
  {/if}
  {#if reply.quoted}
    <button
      type="button"
      class="quoted-comment"
      onclick={scrollToQuoted}
      disabled={isQuoteDeleted}
    >
      <p class="quoted-body">
        {isQuoteDeleted
          ? 'This message has been deleted.'
          : (reply.quoted.isOwnerReply ? 'Owner' : '#' + reply.quoted.commenterDisplayId) + ': ' + reply.quoted.body}
      </p>
    </button>
  {/if}
  <span class="reply-author">{reply.authorName}</span>
  {#if reply.commenterDisplayId}
    <span class="commenter-id">#{reply.commenterDisplayId}</span>
  {/if}
  <p class="reply-body">{truncated.displayBody}</p>
  {#if truncated.isLong}
    <button class="btn-show-more" onclick={() => expanded = !expanded}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  {/if}
  <div class="reply-meta">
    <span class="comment-time">{timeAgo(reply.createdAt)}</span>
    <div style="display:flex;gap:8px">
      {#if isOwn}
        <button class="btn-delete-own" onclick={deleteReply}>Delete</button>
      {/if}
      <button class="btn-reply" onclick={() => replyOpen ? (replyOpen = false) : openReply()}>
        {replyOpen ? 'Cancel' : 'Reply'}
      </button>
    </div>
  </div>
  {#if replyOpen}
    <div class="reply-input-area">
      <div class="quoted-preview">
        <p class="quoted-preview-body">
          {
            (reply.isOwnerReply ? 'Owner' : '#'
            + reply.commenterDisplayId)
            + ': ' + reply.body
          }
        </p>
      </div>
      <input
        class="author-input"
        bind:value={replyAuthorName}
        maxlength={30}
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
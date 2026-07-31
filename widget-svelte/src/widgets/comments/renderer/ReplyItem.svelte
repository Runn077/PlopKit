<script lang="ts">
  import type { Reply, PostReplyFn, DeleteReplyFn } from '../../../types'
  import { Toast } from '../toast.svelte'
  import { timeAgo } from '../timeago'
  import { getTruncatedBody } from '../truncate'

  export interface Props {
    reply: Reply
    widgetKey: string
    parentId: string
    ownDisplayId: string | null
    onPostReply: PostReplyFn
    onDeleteReply: DeleteReplyFn
    onReplyPosted: (reply: Reply) => void
    onDeleted: (replyId: string) => void
  }

  let { reply, widgetKey, parentId, ownDisplayId, onPostReply, onDeleteReply, onReplyPosted, onDeleted }: Props = $props()

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
    !!ownDisplayId && reply.commenterDisplayId === ownDisplayId && !reply.isOwnerReply
  )

  function loadSavedName() {
    try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' }
  }

  function saveName(name: string) {
    try {
      if (name.trim()) localStorage.setItem(STORAGE_KEY, name.trim())
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  function openReply() {
    replyAuthorName = loadSavedName()
    replyOpen = true
  }

  async function deleteReply() {
    try {
      await onDeleteReply(reply.id)
      onDeleted(reply.id)
    } catch (err: any) {
      toast.show(err?.message || 'Failed to delete reply')
    }
  }

  async function postReply() {
    if (!replyBody.trim()) return
    const nameToSend = replyAuthorName.trim() || ''
    try {
      const newReply = await onPostReply(parentId, replyBody, nameToSend, reply.id)
      saveName(nameToSend)
      replyBody = ''
      replyOpen = false
      onReplyPosted(newReply)
      toast.show(newReply.status === 'approved'
        ? 'Reply posted!'
        : 'Your reply has been submitted and is awaiting approval.')
    } catch (err: any) {
      toast.show(err?.message || 'Failed to post reply')
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
  {#if reply.isOwnerReply}<span class="owner-badge">Owner</span>{/if}
  {#if reply.quoted}
    <button type="button" class="quoted-comment" onclick={scrollToQuoted} disabled={isQuoteDeleted}>
      <p class="quoted-body">
        {isQuoteDeleted
          ? 'This message has been deleted.'
          : (reply.quoted.isOwnerReply ? 'Owner' : '#' + reply.quoted.commenterDisplayId) + ': ' + reply.quoted.body}
      </p>
    </button>
  {/if}
  <span class="reply-author">{reply.authorName}</span>
  {#if reply.commenterDisplayId}<span class="commenter-id">#{reply.commenterDisplayId}</span>{/if}
  <p class="reply-body">{truncated.displayBody}</p>
  {#if truncated.isLong}
    <button class="btn-show-more" onclick={() => expanded = !expanded}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  {/if}
  <div class="reply-meta">
    <span class="comment-time">{timeAgo(reply.createdAt)}</span>
    <div style="display:flex;gap:8px">
      {#if isOwn}<button class="btn-delete-own" onclick={deleteReply}>Delete</button>{/if}
      <button class="btn-reply" onclick={() => replyOpen ? (replyOpen = false) : openReply()}>
        {replyOpen ? 'Cancel' : 'Reply'}
      </button>
    </div>
  </div>
  {#if replyOpen}
    <div class="reply-input-area">
      <div class="quoted-preview">
        <p class="quoted-preview-body">
          {(reply.isOwnerReply ? 'Owner' : '#' + reply.commenterDisplayId) + ': ' + reply.body}
        </p>
      </div>
      <input class="author-input" bind:value={replyAuthorName} maxlength={30} placeholder="Name (optional)" />
      <textarea bind:value={replyBody} maxlength={2500} placeholder="Add a reply..."></textarea>
      <div class="reply-actions">
        <span class="char-count">{replyBody.length}/2500</span>
        <div style="display:flex;gap:8px">
          <button class="btn-cancel" onclick={() => { replyOpen = false; replyBody = '' }}>Cancel</button>
          <button class="btn-post-reply" onclick={postReply} disabled={!replyBody.trim()}>Reply</button>
        </div>
      </div>
    </div>
  {/if}
  {#if toast.message}
    <div class="toast {toast.fading ? 'toast-fade-out' : ''}">{toast.message}</div>
  {/if}
</div>
<script lang="ts">
  import ReplyItem from './ReplyItem.svelte'
  import type { Comment, Reply, DeleteCommentFn, PostReplyFn, DeleteReplyFn } from '../../../types'
  import { Toast } from '../toast.svelte'
  import { timeAgo } from '../timeago'
  import { getTruncatedBody } from '../truncate'

  export interface Props {
    comment: Comment
    widgetKey: string
    isPinned: boolean
    ownDisplayId: string | null
    onDeleted: (commentId: string) => void
    onDeleteComment: DeleteCommentFn
    onPostReply: PostReplyFn
    onDeleteReply: DeleteReplyFn
  }

  let { comment, widgetKey, isPinned, ownDisplayId, onDeleted, onDeleteComment, onPostReply, onDeleteReply }: Props = $props()

  let replies = $state<Reply[]>([])
  let expanded = $state(false)
  let showReplies = $state(false)
  let replyOpen = $state(false)
  let replyBody = $state('')
  let replyAuthorName = $state('')
  const toast = new Toast()

  const STORAGE_KEY = $derived(`plopkit_author_${widgetKey}`)
  const REPLIES_PAGE_SIZE = 20
  let visibleReplyCount = $state(REPLIES_PAGE_SIZE)

  const truncated = $derived(getTruncatedBody(comment.body, expanded))
  const visibleReplies = $derived(replies.slice(0, visibleReplyCount))
  const hasMoreReplies = $derived(replies.length > visibleReplyCount)

  const isOwn = $derived(
    !!ownDisplayId && comment.commenterDisplayId === ownDisplayId && !comment.isOwnerReply
  )

  $effect(() => {
    replies = [...comment.replies]
  })

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

  function showMoreReplies() {
    visibleReplyCount += REPLIES_PAGE_SIZE
  }

  function handleReplyPosted(reply: Reply) {
    replies = [...replies, reply]
    showReplies = true
  }

  function handleReplyDeleted(replyId: string) {
    replies = replies.filter(r => r.id !== replyId)
  }

  async function deleteComment() {
    try {
      await onDeleteComment(comment.id)
      onDeleted(comment.id)
    } catch (err: any) {
      toast.show(err?.message || 'Failed to delete comment')
    }
  }

  async function postReply() {
    if (!replyBody.trim()) return
    const nameToSend = replyAuthorName.trim() || ''
    try {
      const newReply = await onPostReply(comment.id, replyBody, nameToSend)
      saveName(nameToSend)
      replyBody = ''
      replyOpen = false
      showReplies = true
      replies = [...replies, newReply]
      toast.show(newReply.status === 'approved'
        ? 'Reply posted!'
        : 'Your reply has been submitted and is awaiting approval.')
    } catch (err: any) {
      toast.show(err?.message || 'Failed to post reply')
    }
  }
</script>

<div class="comment {isPinned ? 'comment-pinned' : ''}" id={`comment-${comment.id}`}>
  {#if isPinned || comment.isOwnerReply}
    <div style="display:flex;gap:6px;margin-bottom:6px">
      {#if isPinned}<span class="pinned-badge">Pinned</span>{/if}
      {#if comment.isOwnerReply}<span class="owner-badge">Owner</span>{/if}
    </div>
  {/if}
  <span class="comment-author">{comment.authorName}</span>
  {#if comment.commenterDisplayId}<span class="commenter-id">#{comment.commenterDisplayId}</span>{/if}
  <p class="comment-body">{truncated.displayBody}</p>
  {#if truncated.isLong}
    <button class="btn-show-more" onclick={() => expanded = !expanded}>
      {expanded ? 'Show less' : 'Show more'}
    </button>
  {/if}
  <div class="comment-meta">
    <span class="comment-time">{timeAgo(comment.createdAt)}</span>
    <div class="comment-actions">
      {#if isOwn}<button class="btn-delete-own" onclick={deleteComment}>Delete</button>{/if}
      <button class="btn-reply" onclick={() => replyOpen ? (replyOpen = false) : openReply()}>
        {replyOpen ? 'Cancel' : 'Reply'}
      </button>
    </div>
  </div>
  {#if replyOpen}
    <div class="reply-input-area">
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
  {#if replies.length > 0}
    <button class="btn-show-replies" onclick={() => showReplies = !showReplies}>
      {showReplies ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
    </button>
    {#if showReplies}
      <div class="replies">
        {#each visibleReplies as r (r.id)}
          <ReplyItem
            reply={r}
            {widgetKey}
            parentId={comment.id}
            {ownDisplayId}
            {onPostReply}
            {onDeleteReply}
            onReplyPosted={handleReplyPosted}
            onDeleted={handleReplyDeleted}
          />
        {/each}
        {#if hasMoreReplies}
          <button class="btn-show-replies" onclick={showMoreReplies}>
            Show {Math.min(REPLIES_PAGE_SIZE, replies.length - visibleReplyCount)} more {replies.length - visibleReplyCount === 1 ? 'reply' : 'replies'}
          </button>
        {/if}
      </div>
    {/if}
  {/if}
</div>
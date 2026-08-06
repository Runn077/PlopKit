<script lang="ts">
  import InputArea from './InputArea.svelte'
  import CommentItem from './CommentItem.svelte'
  import type {
    Comment, NewComment, PostCommentFn, DeleteCommentFn, PostReplyFn, DeleteReplyFn
  } from '../../../types'

  export interface Props {
    widgetKey: string
    comments: Comment[]
    pinnedComment: Comment | null
    hasMore: boolean
    loading: boolean
    total: number
    limitReached: boolean
    ownDisplayId: string | null
    onLoadMore: () => void
    onPost: PostCommentFn
    onDeleteComment: DeleteCommentFn
    onPostReply: PostReplyFn
    onDeleteReply: DeleteReplyFn
  }

  let {
    widgetKey, comments, pinnedComment, hasMore, loading, total, limitReached, ownDisplayId,
    onLoadMore, onPost, onDeleteComment, onPostReply, onDeleteReply
  }: Props = $props()

  // local mutable copies so deletes/posts can update the list without the container re-fetching
  let localComments = $state<Comment[]>([])
  let localPinned = $state<Comment | null>(null)
  let localTotal = $state(0)

  $effect(() => { localComments = comments })
  $effect(() => { localPinned = pinnedComment })
  $effect(() => { localTotal = total })

  function handleCommentPosted(data: NewComment, status: string) {
    if (status === 'approved') {
      localComments = [{ ...data, replies: [] }, ...localComments]
      localTotal += 1
    }
  }

  function handlePinnedDeleted() {
    localPinned = null
    localTotal -= 1
  }

  function handleCommentDeleted(id: string) {
    localComments = localComments.filter(c => c.id !== id)
    localTotal -= 1
  }
</script>

<div class="widget">
  {#if limitReached}
    <p class="empty">Comments are temporarily unavailable.</p>
  {:else}
    <h3>{localTotal} {localTotal === 1 ? 'Comment' : 'Comments'}</h3>

    <InputArea {widgetKey} onPost={onPost} onPosted={handleCommentPosted} />

    <div class="comments-list">
      {#if localComments.length === 0 && !localPinned && !loading}
        <p class="empty">No comments yet. Be the first!</p>
      {/if}
      {#if localPinned}
        <CommentItem
          comment={localPinned}
          {widgetKey}
          isPinned={true}
          {ownDisplayId}
          onDeleted={handlePinnedDeleted}
          {onDeleteComment}
          {onPostReply}
          {onDeleteReply}
        />
      {/if}
      {#each localComments as c (c.id)}
        <CommentItem
          comment={c}
          {widgetKey}
          isPinned={false}
          {ownDisplayId}
          onDeleted={handleCommentDeleted}
          {onDeleteComment}
          {onPostReply}
          {onDeleteReply}
        />
      {/each}
      {#if hasMore}
        <button class="btn-load-more" onclick={onLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load more'}
        </button>
      {/if}
    </div>
  {/if}
  <div class="powered-by">
    <a href="https://plopkit.com" target="_blank" rel="noopener noreferrer">Powered by PlopKit</a>
  </div>
</div>
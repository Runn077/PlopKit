<script lang="ts">
  import { onMount } from 'svelte'
  import CommentsRenderer from '../renderer/CommentsRenderer.svelte'
  import type { Comment, CommentsResponse, NewComment, Reply } from '../../../types'

  export interface Props {
    widgetKey: string
    pageUrl: string
    secret: string
    ownDisplayId: string | null
  }

  let { widgetKey, pageUrl, secret, ownDisplayId }: Props = $props()

  let comments = $state<Comment[]>([])
  let pinnedComment = $state<Comment | null>(null)
  let hasMore = $state(false)
  let loading = $state(false)
  let total = $state(0)
  let limitReached = $state(false)

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

  async function handlePost(body: string, authorName: string): Promise<NewComment> {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body,
        author_name: authorName || undefined,
        commenter_secret: secret,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to post comment')
    return data
  }

  async function handleDeleteComment(commentId: string): Promise<void> {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, commenter_secret: secret }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to delete comment')
    }
  }

  async function handlePostReply(
    parentId: string,
    body: string,
    authorName: string,
    quotedId?: string
  ): Promise<Reply & { status: 'approved' | 'pending' }> {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body,
        parent_id: parentId,
        quoted_id: quotedId,
        author_name: authorName || undefined,
        commenter_secret: secret,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to post reply')
    return {
      id: data.id,
      body: data.body,
      authorName: data.authorName,
      createdAt: data.createdAt,
      quotedId: data.quotedId ?? null,
      quoted: data.quoted ?? null,
      isOwnerReply: false,
      commenterDisplayId: data.commenterDisplayId,
      status: data.status,
    }
  }

  async function handleDeleteReply(replyId: string): Promise<void> {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: replyId, commenter_secret: secret }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to delete reply')
    }
  }

  onMount(() => {
    fetchComments()
  })
</script>

<CommentsRenderer
  {widgetKey}
  {comments}
  {pinnedComment}
  {hasMore}
  {loading}
  {total}
  {limitReached}
  {ownDisplayId}
  onLoadMore={loadMore}
  onPost={handlePost}
  onDeleteComment={handleDeleteComment}
  onPostReply={handlePostReply}
  onDeleteReply={handleDeleteReply}
/>
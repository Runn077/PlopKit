<script lang="ts">
  import { Toast } from '../toast.svelte'
  import type { PostCommentFn, NewComment } from '../../../types'

  export interface Props {
    widgetKey: string
    onPost: PostCommentFn
    onPosted: (comment: NewComment, status: string) => void
  }

  let { widgetKey, onPost, onPosted }: Props = $props()

  let body = $state('')
  let authorName = $state('')
  const toast = new Toast()

  const STORAGE_KEY = $derived(`plopkit_author_${widgetKey}`)

  function loadSavedName() {
    try { return localStorage.getItem(STORAGE_KEY) ?? '' } catch { return '' }
  }

  function saveName(name: string) {
    try {
      if (name.trim()) localStorage.setItem(STORAGE_KEY, name.trim())
      else localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  async function postComment() {
    if (!body.trim()) return
    const nameToSend = authorName.trim() || ''
    try {
      const data = await onPost(body, nameToSend)
      saveName(nameToSend)
      body = ''
      toast.show(data.status === 'approved'
        ? 'Comment posted!'
        : 'Your comment has been submitted and is awaiting approval.')
      onPosted(data, data.status)
    } catch (err: any) {
      toast.show(err?.message || 'Failed to post comment')
    }
  }

  authorName = loadSavedName()
</script>

<div class="input-area">
  <input class="author-input" bind:value={authorName} maxlength={30} placeholder="Name (optional)" />
  <textarea bind:value={body} maxlength={2500} placeholder="Add a comment..."></textarea>
  <div class="input-actions">
    <span class="char-count">{body.length}/2500</span>
    <button class="btn-post" onclick={postComment} disabled={!body.trim()}>Post</button>
  </div>
</div>
{#if toast.message}
  <div class="toast {toast.fading ? 'toast-fade-out' : ''}">{toast.message}</div>
{/if}
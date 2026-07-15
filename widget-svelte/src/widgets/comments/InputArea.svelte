<script lang="ts">
  import { Toast } from './toast.svelte'
  import type { NewComment } from '../../types'

  interface Props {
    widgetKey: string
    pageUrl: string
    secret: string | null
    onPosted: (comment: NewComment, status: string) => void
  }

  let { widgetKey, pageUrl, secret, onPosted }: Props = $props()

  let body = $state('')
  let authorName = $state('')
  const toast = new Toast()

  const STORAGE_KEY = $derived(`plopkit_author_${widgetKey}`)

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

  async function postComment() {
    if (!body.trim()) return
    const nameToSend = authorName.trim() || ''
    const res = await fetch(`${import.meta.env.VITE_API_URL}/public/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        widget_key: widgetKey,
        page_url: pageUrl,
        body,
        author_name: nameToSend || undefined,
        commenter_secret: secret ?? undefined,
      }),
    })

    const data: NewComment = await res.json()
    if (!res.ok) {
      toast.show((data as any).error || 'Failed to post comment')
      return
    }

    saveName(nameToSend)
    body = ''

    if (data.status === 'approved') {
      toast.show('Comment posted!')
    } else {
      toast.show('Your comment has been submitted and is awaiting approval.')
    }

    onPosted(data, data.status)
  }

  authorName = loadSavedName()
</script>

<div class="input-area">
  <input
    class="author-input"
    bind:value={authorName}
    maxlength={30}
    placeholder="Name (optional)"
  />
  <textarea
    bind:value={body}
    maxlength={2500}
    placeholder="Add a comment..."
  ></textarea>
  <div class="input-actions">
    <span class="char-count">{body.length}/2500</span>
    <button class="btn-post" onclick={postComment} disabled={!body.trim()}>
      Post
    </button>
  </div>
</div>
{#if toast.message}
  <div class="toast {toast.fading ? 'toast-fade-out' : ''}">{toast.message}</div>
{/if}
<script lang="ts">
  import { onMount } from 'svelte'
  import LiveContainer from './container/LiveContainer.svelte'
  import PreviewContainer from './container/PreviewContainer.svelte'
  import type { BaseWidgetProps } from '../../types'
  import styles from './comments.css?inline'
  import sharedStyles from './shared.css?inline'
  import inputAreaStyles from './renderer/InputArea.css?inline'
  import commentItemStyles from './renderer/CommentItem.css?inline'
  import replyItemStyles from './renderer/ReplyItem.css?inline'

  let { widgetKey, pageUrl, shadowRoot, theme, preview }: BaseWidgetProps = $props()

  let secret = $state<string | null>(null)
  let ownDisplayId = $state<string | null>(null)

  const SECRET_KEY = 'plopkit_commenter_secret'

  function loadOrCreateSecret(): string {
    try {
      const existing = localStorage.getItem(SECRET_KEY)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (existing && uuidRegex.test(existing)) return existing
      const newSecret = crypto.randomUUID()
      localStorage.setItem(SECRET_KEY, newSecret)
      return newSecret
    } catch {
      return crypto.randomUUID()
    }
  }

  async function computeDisplayId(secret: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(secret)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const base64 = btoa(String.fromCharCode(...hashArray))
    return base64.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  }

  function applyTheme() {
    if (!theme?.tokens) return
    const host = shadowRoot.host as HTMLElement
    for (const [key, value] of Object.entries(theme.tokens)) {
      const cssVar = '--pkw-' + key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      host.style.setProperty(cssVar, value as string)
    }
  }

  function injectStyles() {
    const allStyles = [sharedStyles, styles, inputAreaStyles, commentItemStyles, replyItemStyles]
    for (const css of allStyles) {
      const el = document.createElement('style')
      el.textContent = css
      shadowRoot.appendChild(el)
    }
  }

  onMount(async () => {
    injectStyles()
    applyTheme()
    if (preview) {
      ownDisplayId = 'preview-you'
      secret = 'preview'
    } else {
      secret = loadOrCreateSecret()
      ownDisplayId = await computeDisplayId(secret)
    }
  })
</script>

{#if secret !== null}
  {#if preview}
    <PreviewContainer {widgetKey} {ownDisplayId} />
  {:else}
    <LiveContainer {widgetKey} {pageUrl} {secret} {ownDisplayId} />
  {/if}
{/if}
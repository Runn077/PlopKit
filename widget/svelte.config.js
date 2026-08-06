import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  onwarn: (warning, handler) => {
    if (warning.code === 'state_referenced_locally') return
    handler(warning)
  }
}
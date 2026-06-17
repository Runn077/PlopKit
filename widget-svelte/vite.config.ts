import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'PlopKit',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
        drop_console: true,
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
      },
      mangle: {
        properties: false,
      },
      format: {
        comments: false,
      },
    },
  },
})
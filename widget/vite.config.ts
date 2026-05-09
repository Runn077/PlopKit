import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'PlopKit',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
  },
})
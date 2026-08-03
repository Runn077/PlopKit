// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite'

const mode = process.env.NODE_ENV ?? 'production';
const { PUBLIC_APP_URL } = loadEnv(mode, process.cwd(), 'PUBLIC_')

export default defineConfig({
  redirects: {
    '/login': `${PUBLIC_APP_URL}/login`,
    '/signup': `${PUBLIC_APP_URL}/signup`,
  },
})
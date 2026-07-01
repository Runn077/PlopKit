import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields, magicLinkClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL,
  plugins: [
    inferAdditionalFields({
      user: {
        plan: {
          type: 'string' as const,
          required: false,
          defaultValue: 'free',
        }
      }
    }),
    magicLinkClient(),
  ]
})
export const { signIn, signUp, signOut, useSession } = authClient
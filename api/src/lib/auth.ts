import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma.js'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [process.env.PLATFORM_URL!],
  user: {
    additionalFields: {
      plan: {
        type: 'string',
        required: false,
        defaultValue: 'free',
        input: false,
      },
    },
  },
})
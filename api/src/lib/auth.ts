import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from './prisma.js'
import { sendWelcomeEmail } from '../emails/index.js'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
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
      pendingPlan: {
        type: 'string',
        required: false,
        input: false,
      },
      usageResetAt: {
        type: 'date',
        required: false,
        input: false,
      },
      stripeCustomerId: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await sendWelcomeEmail(user.email, user.name ?? 'there')
          } catch (err) {
            console.error('Failed to send welcome email:', err)
          }

          const usageResetAt = new Date()
          usageResetAt.setDate(usageResetAt.getDate() + 30)

          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { usageResetAt },
            })
          } catch (err) {
            console.error('Failed to set initial usageResetAt:', err)
          }
        },
      },
    },
  },
})
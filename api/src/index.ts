import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import prisma from './lib/prisma.js'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import commentsRouter from './routes/comments.js'
import sitesRouter from './routes/sites.js'

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
    ]
    if (!origin || allowed.includes(origin) || origin.startsWith('http://localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.use('/comments', commentsRouter)
app.use('/sites', sitesRouter)

cron.schedule('0 0 * * *', async () => {
  const deleted = await prisma.site.deleteMany({
    where: {
      verified: false,
      expiresAt: { lt: new Date() },
    },
  })
  console.log(`Cleaned up ${deleted.count} expired unverified sites`)
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
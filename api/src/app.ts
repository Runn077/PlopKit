import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { errorHandler } from './errors/errorHandler.js'
import commentsRouter from './routes/comments/comments.js'
import publicCommentsRouter from './routes/comments/publicComments.js'
import sitesRouter from './routes/sites.js'
import widgetsRouter from './routes/widgets.js'
import accountRouter from './routes/account.js'
import helmet from 'helmet'
import { globalLimiter } from './middleware/rateLimiters.js'

const app = express()
app.set('trust proxy', 1)
app.use(helmet())
app.use(express.json({ limit: '20mb' }))

app.use((req, res, next) => {
  if (req.path.startsWith('/api/public')) {
    return cors({ origin: '*', credentials: false })(req, res, next)
  }
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const allowed = [
        process.env.PLATFORM_URL,
        process.env.WWW_PLATFORM_URL
      ].filter(Boolean)
      allowed.includes(origin) ? callback(null, true) : callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })(req, res, next)
})

app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/public/comments')) return next()
  globalLimiter(req, res, next)
})

app.get('/api/health', (_, res) => {
  res.json({ ok: true })
})

app.all('/api/auth/*splat', toNodeHandler(auth))

if (process.env.ENABLE_CLOUD === 'true') {
  const { handleWebhook } = await import('./cloud/services/billing.service.js')
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
    try {
      const signature = req.headers['stripe-signature'] as string
      await handleWebhook(req.body, signature)
      res.json({ received: true })
    } catch (err) { 
      next(err) 
    }
  })
}

app.use(express.json())

app.use('/api/comments', commentsRouter)

app.use('/api/public/comments', publicCommentsRouter)
app.use('/api/sites', sitesRouter)
app.use('/api/widgets', widgetsRouter)
app.use('/api/account', accountRouter)

if (process.env.ENABLE_CLOUD === 'true') {
  const { default: billingRouter } = await import('./cloud/routes/billing.js')
  app.use('/api/billing', billingRouter)
}

app.use(errorHandler)

export default app
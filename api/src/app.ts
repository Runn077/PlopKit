import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { errorHandler } from './errors/errorHandler.js'
import commentsRouter from './routes/comments.js'
import sitesRouter from './routes/sites.js'
import widgetsRouter from './routes/widgets.js'
import accountRouter from './routes/account.js'

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['http://localhost:5173', 'http://localhost:5174']
    if (!origin || allowed.includes(origin) || origin.startsWith('http://localhost')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/comments')) return next()
  globalLimiter(req, res, next)
})

app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.use('/comments', commentsRouter)
app.use('/sites', sitesRouter)
app.use('/widgets', widgetsRouter)
app.use('/account', accountRouter)

app.use(errorHandler)

export default app
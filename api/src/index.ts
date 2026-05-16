import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { startCronJobs } from './lib/cron.js'
import commentsRouter from './routes/comments.js'
import sitesRouter from './routes/sites.js'
import widgetsRouter from './routes/widgets.js'


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
app.use('/widgets', widgetsRouter)

startCronJobs()

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
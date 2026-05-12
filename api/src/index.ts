import express from 'express'
import cors from 'cors'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import commentsRouter from './routes/comments.js'

const app = express()

app.use(cors({
  origin: process.env.WIDGET_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))

// Must be before express.json()
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())
app.use('/comments', commentsRouter)

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
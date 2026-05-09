import express from 'express'
import cors from 'cors'
import commentsRouter from './routes/comments.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/comments', commentsRouter)

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
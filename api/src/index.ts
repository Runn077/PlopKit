import app from './app.js'
import { startScheduler } from './lib/scheduler.js'

startScheduler()

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
import app from './app.js'
import { startCoreScheduler } from './lib/scheduler.js'

startCoreScheduler()

if (process.env.ENABLE_CLOUD) {
  const { startCloudScheduler } = await import('./lib/cloudScheduler.js')
  startCloudScheduler()
}

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
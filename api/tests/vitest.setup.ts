import { beforeEach, afterAll } from 'vitest'
import { resetDatabase, prisma } from './setup.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await prisma.$disconnect()
})
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommentStatus } from '../../generated/prisma/enums.js'
import { LIMITS } from '../../constants/index.js'

vi.mock('../prisma.js', () => ({
  default: {
    comment: { deleteMany: vi.fn() },
  },
}))

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn(),
  },
}))

import prisma from '../prisma.js'
import cron from 'node-cron'
import { startCoreScheduler } from '../scheduler.js'

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-15T00:00:00.000Z'))
})

function getScheduledCallback(callIndex: number): () => Promise<void> {
  const call = vi.mocked(cron.schedule).mock.calls[callIndex]
  return call![1] as () => Promise<void>
}

describe('startCoreScheduler', () => {
  it('registers exactly two cron jobs', () => {
    startCoreScheduler()
    expect(cron.schedule).toHaveBeenCalledTimes(2)
  })

  it('registers both jobs on a daily midnight schedule', () => {
    startCoreScheduler()
    expect(cron.schedule).toHaveBeenNthCalledWith(1, '0 0 * * *', expect.any(Function))
    expect(cron.schedule).toHaveBeenNthCalledWith(2, '0 0 * * *', expect.any(Function))
  })

  describe('soft-delete cleanup job', () => {
    it('deletes comments soft-deleted before the SOFT_DELETE_EXPIRY_DAYS cutoff', async () => {
      vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 3 } as any)
      startCoreScheduler()

      const job = getScheduledCallback(0)
      await job()

      const expectedCutoff = new Date('2026-07-15T00:00:00.000Z')
      expectedCutoff.setDate(expectedCutoff.getDate() - LIMITS.SOFT_DELETE_EXPIRY_DAYS)

      expect(prisma.comment.deleteMany).toHaveBeenCalledWith({
        where: { deletedAt: { lt: expectedCutoff } },
      })
    })

    it('does not filter by status, so both pending and approved soft-deleted comments are cleaned up', async () => {
      vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 0 } as any)
      startCoreScheduler()

      const job = getScheduledCallback(0)
      await job()

      const callArg = vi.mocked(prisma.comment.deleteMany).mock.calls[0]![0] as any
      expect(callArg.where.status).toBeUndefined()
    })
  })

  describe('pending expiry cleanup job', () => {
    it('deletes only pending, non-deleted comments older than PENDING_EXPIRY_DAYS', async () => {
      vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 5 } as any)
      startCoreScheduler()

      const job = getScheduledCallback(1)
      await job()

      const expectedCutoff = new Date('2026-07-15T00:00:00.000Z')
      expectedCutoff.setDate(expectedCutoff.getDate() - LIMITS.PENDING_EXPIRY_DAYS)

      expect(prisma.comment.deleteMany).toHaveBeenCalledWith({
        where: {
          status: CommentStatus.pending,
          deletedAt: null,
          createdAt: { lt: expectedCutoff },
        },
      })
    })

    it('excludes already soft-deleted comments from the pending-expiry cleanup', async () => {
      vi.mocked(prisma.comment.deleteMany).mockResolvedValue({ count: 0 } as any)
      startCoreScheduler()

      const job = getScheduledCallback(1)
      await job()

      const callArg = vi.mocked(prisma.comment.deleteMany).mock.calls[0]![0] as any
      expect(callArg.where.deletedAt).toBeNull()
    })
  })
})
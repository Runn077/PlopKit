import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response, NextFunction } from 'express'

vi.mock('../../lib/auth.js', () => ({
  auth: {
    api: { getSession: vi.fn() },
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(),
}))

import { auth } from '../../lib/auth.js'
import { fromNodeHeaders } from 'better-auth/node'
import { requireAuth } from '../requireAuth.js'

function mockRes() {
  const res: Partial<Response> = { locals: {} }
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('responds with 401 and does not call next() when there is no session', async () => {
    vi.mocked(fromNodeHeaders).mockReturnValue({} as any)
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const req = { headers: {} } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    await requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })

  it('attaches the session to res.locals and calls next() when authenticated', async () => {
    const session = { user: { id: 'user_1' } }
    vi.mocked(fromNodeHeaders).mockReturnValue({} as any)
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any)

    const req = { headers: {} } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    await requireAuth(req, res, next)

    expect(res.locals.session).toBe(session)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('converts req.headers via fromNodeHeaders before calling getSession', async () => {
    const convertedHeaders = { authorization: 'converted' }
    vi.mocked(fromNodeHeaders).mockReturnValue(convertedHeaders as any)
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'user_1' } } as any)

    const rawHeaders = { authorization: 'raw' }
    const req = { headers: rawHeaders } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    await requireAuth(req, res, next)

    expect(fromNodeHeaders).toHaveBeenCalledWith(rawHeaders)
    expect(auth.api.getSession).toHaveBeenCalledWith({ headers: convertedHeaders })
  })

  it('does not set res.locals.session when unauthorized', async () => {
    vi.mocked(fromNodeHeaders).mockReturnValue({} as any)
    vi.mocked(auth.api.getSession).mockResolvedValue(null)

    const req = { headers: {} } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    await requireAuth(req, res, next)

    expect(res.locals.session).toBeUndefined()
  })
})
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import type { Request, Response, NextFunction } from 'express'
import { validate } from '../validate.js'

function mockRes() {
  const res: Partial<Response> = {}
  res.status = vi.fn().mockReturnValue(res)
  res.json = vi.fn().mockReturnValue(res)
  return res as Response
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})

describe('validate — success path', () => {
  it('calls next() when the body is valid', () => {
    const req = { body: { name: 'Ru' } } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema)(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('replaces req.body directly with the parsed data for target "body"', () => {
    const schemaWithDefault = z.object({
      name: z.string().min(1),
      extra: z.string().default('injected'),
    })
    const req = { body: { name: 'Ru' } } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schemaWithDefault, 'body')(req, res, next)

    expect(req.body).toEqual({ name: 'Ru', extra: 'injected' })
  })

  it('uses Object.assign rather than reassignment for target "query"', () => {
    const schemaWithDefault = z.object({
      name: z.string().min(1),
      extra: z.string().default('injected'),
    })
    const originalQuery = { name: 'Ru' }
    const req = { query: originalQuery } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schemaWithDefault, 'query')(req, res, next)

    expect(req.query).toBe(originalQuery)
    expect(req.query).toEqual({ name: 'Ru', extra: 'injected' })
  })

  it('uses Object.assign rather than reassignment for target "params"', () => {
    const originalParams = { name: 'Ru' }
    const req = { params: originalParams } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema, 'params')(req, res, next)

    expect(req.params).toBe(originalParams)
    expect(req.params).toEqual({ name: 'Ru' })
  })

  it('defaults to validating "body" when no target is given', () => {
    const req = { body: { name: 'Ru' } } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema)(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('validate — failure path', () => {
  it('responds with 400 and does not call next() when validation fails', () => {
    const req = { body: { name: '' } } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema)(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns the first Zod issue message in the error response', () => {
    const req = { body: { name: '' } } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema)(req, res, next)

    expect(res.json).toHaveBeenCalledWith({ error: 'Name is required' })
  })

  it('falls back to a generic message when the issue has no message', () => {
    const req = { body: { name: 123 } } as unknown as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema)(req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    const jsonArg = vi.mocked(res.json).mock.calls[0]![0] as any
    expect(typeof jsonArg.error).toBe('string')
  })

  it('does not mutate req.body when validation fails', () => {
    const originalBody = { name: '' }
    const req = { body: originalBody } as Request
    const res = mockRes()
    const next = vi.fn() as NextFunction

    validate(schema)(req, res, next)

    expect(req.body).toBe(originalBody)
  })
})
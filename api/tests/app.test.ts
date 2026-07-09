import { describe, it, expect, vi, afterAll } from 'vitest'
import request from 'supertest'

import app from '../src/app.js'

const originalEnableCloud = process.env.ENABLE_CLOUD
const originalPlatformUrl = process.env.PLATFORM_URL

afterAll(() => {
  process.env.ENABLE_CLOUD = originalEnableCloud
  process.env.PLATFORM_URL = originalPlatformUrl
})

describe('GET /api/health', () => {
  it('returns ok: true', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})

describe('unknown routes', () => {
  it('returns a non-2xx status for a route that matches no router', async () => {
    const res = await request(app).get('/api/definitely-not-a-real-route')
    expect(res.status).not.toBe(200)
  })
})

describe('CORS — public routes', () => {
  it('allows any origin on /api/public/* with a wildcard header', async () => {
    const res = await request(app)
      .get('/api/public/comments')
      .set('Origin', 'https://any-random-site.com')
      .query({ widget_key: 'does_not_matter' })

    expect(res.headers['access-control-allow-origin']).toBe('*')
  })
})

describe('CORS — platform routes', () => {
  it('allows the configured PLATFORM_URL as an origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', process.env.PLATFORM_URL!)

    expect(res.headers['access-control-allow-origin']).toBe(process.env.PLATFORM_URL)
  })

  it('rejects a request with an origin not in the allowed list', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://evil.com')

    expect(res.status).not.toBe(200)
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('allows requests with no Origin header at all (e.g. server-to-server, curl)', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
  })
})

describe('error handler', () => {
  it('formats a thrown AppError as { error: message } with the correct status', async () => {
    const res = await request(app)
      .get('/api/public/comments')
      .query({ widget_key: 'does_not_exist_at_all' })

    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
    expect(typeof res.body.error).toBe('string')
  })
})

describe('ENABLE_CLOUD gating — self-hosted mode (default)', () => {
  it('does not mount the billing webhook route', async () => {
    const res = await request(app).post('/api/billing/webhook').send({})
    expect(res.status).toBe(404)
  })

  it('does not mount the billing router', async () => {
    const res = await request(app).get('/api/billing/anything')
    expect(res.status).toBe(404)
  })
})

describe('ENABLE_CLOUD gating — cloud mode', () => {
  it('mounts the billing webhook route and the billing router when ENABLE_CLOUD is true', async () => {
    vi.resetModules()

    vi.doMock('../src/cloud/services/billing.service.js', () => ({
      handleWebhook: vi.fn().mockResolvedValue(undefined),
    }))

    vi.doMock('../src/cloud/routes/billing.js', () => {
      const { Router } = require('express')
      const router = Router()
      router.get('/ping', (_req: any, res: any) => res.json({ pong: true }))
      return { default: router }
    })

    process.env.ENABLE_CLOUD = 'true'

    const { default: cloudApp } = await import('../src/app.js')

    const webhookRes = await request(cloudApp).post('/api/billing/webhook').send('{}')
    expect(webhookRes.status).toBe(200)
    expect(webhookRes.body).toEqual({ received: true })

    const routerRes = await request(cloudApp).get('/api/billing/ping')
    expect(routerRes.status).toBe(200)
    expect(routerRes.body).toEqual({ pong: true })

    vi.doUnmock('../src/cloud/services/billing.service.js')
    vi.doUnmock('../src/cloud/routes/billing.js')
    vi.resetModules()
  })
})
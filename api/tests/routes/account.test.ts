import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { prisma } from '../setup.js'

vi.mock('../../src/lib/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(async ({ headers }: { headers: Headers }) => {
        const userId = headers.get('x-test-user-id')
        if (!userId) return null
        return { user: { id: userId } }
      }),
    },
  },
}))

import app from '../../src/app.js'

function authHeader(userId: string) {
  return { 'x-test-user-id': userId }
}

async function createUser(overrides: Partial<any> = {}) {
  return prisma.user.create({
    data: {
      email: `user_${Date.now()}_email-from-running-plopkit-tests@example.com`,
      ...overrides,
    },
  })
}

const originalEnableCloud = process.env.ENABLE_CLOUD

beforeEach(() => {
  process.env.ENABLE_CLOUD = originalEnableCloud
})

afterEach(() => {
  process.env.ENABLE_CLOUD = originalEnableCloud
})

describe('requireAuth wiring', () => {
  it('returns 401 for GET /me without a session', async () => {
    const res = await request(app).get('/api/account/me')
    expect(res.status).toBe(401)
  })

  it('returns 401 for DELETE / without a session', async () => {
    const res = await request(app).delete('/api/account')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/account/me', () => {
  it('returns provider metadata for the authenticated user', async () => {
    const user = await createUser()

    const res = await request(app).get('/api/account/me').set(authHeader(user.id))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ provider: null })
  })
})

describe('GET /api/account/load-stats', () => {
  it('returns 0 monthlyLoads for a user with no widgets', async () => {
    const user = await createUser()

    const res = await request(app).get('/api/account/load-stats').set(authHeader(user.id))

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ monthlyLoads: 0 })
  })
})

describe('GET /api/account/usage', () => {
  it('returns 404 when ENABLE_CLOUD is not the exact string "true"', async () => {
    process.env.ENABLE_CLOUD = 'false'
    const user = await createUser()

    const res = await request(app).get('/api/account/usage').set(authHeader(user.id))

    expect(res.status).toBe(404)
    expect(res.body.error).toBe('Usage tracking is not available in self-hosted mode')
  })

  it('returns 404 when ENABLE_CLOUD is unset', async () => {
    delete process.env.ENABLE_CLOUD
    const user = await createUser()

    const res = await request(app).get('/api/account/usage').set(authHeader(user.id))

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/account/name', () => {
  it('returns 400 when name is empty', async () => {
    const user = await createUser()

    const res = await request(app)
      .patch('/api/account/name')
      .set(authHeader(user.id))
      .send({ name: '' })

    expect(res.status).toBe(400)
  })

  it('updates the user name', async () => {
    const user = await createUser()

    const res = await request(app)
      .patch('/api/account/name')
      .set(authHeader(user.id))
      .send({ name: 'New Name' })

    expect(res.status).toBe(200)

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    expect(dbUser?.name).toBe('New Name')
  })
})

describe('DELETE /api/account — cascade behavior', () => {
  it('deletes the user and all of their sites, widgets, and comments', async () => {
    const user = await createUser()
    const site = await prisma.site.create({
      data: {
        name: 'My Site',
        domain: `example-${Date.now()}.com`,
        siteKey: `sk_${Date.now()}`,
        userId: user.id,
      },
    })
    const widget = await prisma.widget.create({
      data: {
        siteId: site.id,
        type: 'comments',
        name: 'Widget',
        widgetKey: `wk_${Date.now()}`,
        commentWidget: { create: { autoApprove: false } },
      },
      include: { commentWidget: true },
    })
    const comment = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Hello',
        authorName: 'Someone',
      },
    })

    const res = await request(app).delete('/api/account').set(authHeader(user.id))
    expect(res.status).toBe(200)

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    const dbSite = await prisma.site.findUnique({ where: { id: site.id } })
    const dbWidget = await prisma.widget.findUnique({ where: { id: widget.id } })
    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } })

    expect(dbUser).toBeNull()
    expect(dbSite).toBeNull()
    expect(dbWidget).toBeNull()
    expect(dbComment).toBeNull()
  })
})
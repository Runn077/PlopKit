import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { prisma } from '../setup.js'
import { WidgetType } from '../../src/generated/prisma/enums.js'

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

async function createUser(email = `user_${Date.now()}_${Math.random()}@example.com`) {
  return prisma.user.create({ data: { email } })
}

async function createSite(userId: string) {
  return prisma.site.create({
    data: {
      name: 'Test Site',
      domain: `example-${Date.now()}-${Math.random()}.com`,
      siteKey: `sk_${Date.now()}_${Math.random()}`,
      userId,
    },
  })
}

describe('requireAuth wiring', () => {
  it('returns 401 for GET /:siteId without a session', async () => {
    const res = await request(app).get('/api/widgets/some_id')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/widgets/:siteId', () => {
  it('returns 404 when the site belongs to a different user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const site = await createSite(otherUser.id)

    const res = await request(app).get(`/api/widgets/${site.id}`).set(authHeader(user.id))
    expect(res.status).toBe(404)
  })

  it('returns widgets scoped to the given site', async () => {
    const user = await createUser()
    const site = await createSite(user.id)
    await prisma.widget.create({
      data: { siteId: site.id, type: WidgetType.comments, name: 'Widget 1', widgetKey: `wk_${Date.now()}` },
    })

    const res = await request(app).get(`/api/widgets/${site.id}`).set(authHeader(user.id))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /api/widgets/single/:widgetId', () => {
  it('returns 404 when the widget belongs to a different user\'s site', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const site = await createSite(otherUser.id)
    const widget = await prisma.widget.create({
      data: { siteId: site.id, type: WidgetType.comments, name: 'Widget 1', widgetKey: `wk_${Date.now()}` },
    })

    const res = await request(app).get(`/api/widgets/single/${widget.id}`).set(authHeader(user.id))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/widgets', () => {
  it('returns 404 when the site does not belong to the requesting user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const site = await createSite(otherUser.id)

    const res = await request(app)
      .post('/api/widgets')
      .set(authHeader(user.id))
      .send({ siteId: site.id, type: WidgetType.comments, name: 'New Widget' })

    expect(res.status).toBe(404)
  })

  it('creates a widget with a real commentWidget row for type comments', async () => {
    const user = await createUser()
    const site = await createSite(user.id)

    const res = await request(app)
      .post('/api/widgets')
      .set(authHeader(user.id))
      .send({ siteId: site.id, type: WidgetType.comments, name: 'New Widget' })

    expect(res.status).toBe(201)
    expect(res.body.commentWidget).toBeTruthy()
    expect(res.body.commentWidget.autoApprove).toBe(false)

    const dbCommentWidget = await prisma.commentWidget.findUnique({ where: { widgetId: res.body.id } })
    expect(dbCommentWidget).not.toBeNull()
  })

  it('generates a widgetKey rather than requiring the client to supply one', async () => {
    const user = await createUser()
    const site = await createSite(user.id)

    const res = await request(app)
      .post('/api/widgets')
      .set(authHeader(user.id))
      .send({ siteId: site.id, type: WidgetType.comments, name: 'New Widget' })

    expect(res.status).toBe(201)
    expect(typeof res.body.widgetKey).toBe('string')
    expect(res.body.widgetKey.length).toBeGreaterThan(0)
  })
})

describe('PATCH /api/widgets/:id', () => {
  it('returns 404 when the widget is not owned by the user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const site = await createSite(otherUser.id)
    const widget = await prisma.widget.create({
      data: { siteId: site.id, type: WidgetType.comments, name: 'Widget 1', widgetKey: `wk_${Date.now()}` },
    })

    const res = await request(app)
      .patch(`/api/widgets/${widget.id}`)
      .set(authHeader(user.id))
      .send({ name: 'Renamed' })

    expect(res.status).toBe(404)
  })

  it('updates the widget name', async () => {
    const user = await createUser()
    const site = await createSite(user.id)
    const widget = await prisma.widget.create({
      data: { siteId: site.id, type: WidgetType.comments, name: 'Old Name', widgetKey: `wk_${Date.now()}` },
    })

    const res = await request(app)
      .patch(`/api/widgets/${widget.id}`)
      .set(authHeader(user.id))
      .send({ name: 'New Name' })

    expect(res.status).toBe(200)
    expect(res.body.name).toBe('New Name')

    const dbWidget = await prisma.widget.findUnique({ where: { id: widget.id } })
    expect(dbWidget?.name).toBe('New Name')
  })
})

describe('DELETE /api/widgets/:id — cascade behavior', () => {
  it('returns 404 when the widget is not owned by the user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const site = await createSite(otherUser.id)
    const widget = await prisma.widget.create({
      data: { siteId: site.id, type: WidgetType.comments, name: 'Widget 1', widgetKey: `wk_${Date.now()}` },
    })

    const res = await request(app).delete(`/api/widgets/${widget.id}`).set(authHeader(user.id))
    expect(res.status).toBe(404)
  })

  it('deleting a widget cascades to its commentWidget and comments', async () => {
    const user = await createUser()
    const site = await createSite(user.id)
    const widget = await prisma.widget.create({
      data: {
        siteId: site.id,
        type: WidgetType.comments,
        name: 'Widget 1',
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

    const res = await request(app).delete(`/api/widgets/${widget.id}`).set(authHeader(user.id))
    expect(res.status).toBe(200)

    const dbCommentWidget = await prisma.commentWidget.findUnique({ where: { id: widget.commentWidget!.id } })
    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } })
    expect(dbCommentWidget).toBeNull()
    expect(dbComment).toBeNull()
  })
})
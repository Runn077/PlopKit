import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { prisma } from '../setup.js'
import { CommentStatus, WidgetType } from '../../src/generated/prisma/enums.js'

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

async function seedSiteWithWidget(userId: string) {
  const site = await prisma.site.create({
    data: {
      name: 'Test Site',
      domain: `example-${Date.now()}-${Math.random()}.com`,
      siteKey: `sk_${Date.now()}_${Math.random()}`,
      userId,
    },
  })
  const widget = await prisma.widget.create({
    data: {
      siteId: site.id,
      type: WidgetType.comments,
      name: 'Main Widget',
      widgetKey: `wk_${Date.now()}_${Math.random()}`,
      commentWidget: { create: { autoApprove: false } },
    },
    include: { commentWidget: true },
  })
  return { site, widget }
}

describe('requireAuth wiring', () => {
  it('returns 401 for GET / without a session', async () => {
    const res = await request(app).get('/api/sites')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/sites', () => {
  it('returns only sites owned by the requesting user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    await seedSiteWithWidget(user.id)
    await seedSiteWithWidget(otherUser.id)

    const res = await request(app).get('/api/sites').set(authHeader(user.id))

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe('GET /api/sites/:id', () => {
  it('returns 404 when the site belongs to a different user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const { site } = await seedSiteWithWidget(otherUser.id)

    const res = await request(app).get(`/api/sites/${site.id}`).set(authHeader(user.id))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/sites — domain uniqueness enforcement', () => {
  it('creates a site with a generated siteKey', async () => {
    const user = await createUser()

    const res = await request(app)
      .post('/api/sites')
      .set(authHeader(user.id))
      .send({ name: 'My Blog', domain: `newsite-${Date.now()}.com` })

    expect(res.status).toBe(201)
    expect(res.body.siteKey).toBeTruthy()
    expect(res.body.verified).toBe(false)
  })

  it('returns 409 when the domain is already registered and verified', async () => {
    const owner = await createUser()
    const domain = `taken-${Date.now()}.com`
    await prisma.site.create({
      data: { name: 'Existing', domain, siteKey: `sk_${Date.now()}`, userId: owner.id, verified: true },
    })

    const otherUser = await createUser()
    const res = await request(app)
      .post('/api/sites')
      .set(authHeader(otherUser.id))
      .send({ name: 'New Site', domain })

    expect(res.status).toBe(409)
  })

  it('deletes an unverified site owned by another user and allows re-registration', async () => {
    const originalOwner = await createUser()
    const domain = `contested-${Date.now()}.com`
    const original = await prisma.site.create({
      data: { name: 'Unverified', domain, siteKey: `sk_${Date.now()}`, userId: originalOwner.id, verified: false },
    })

    const newOwner = await createUser()
    const res = await request(app)
      .post('/api/sites')
      .set(authHeader(newOwner.id))
      .send({ name: 'Reclaimed Site', domain })

    expect(res.status).toBe(201)

    const dbOriginal = await prisma.site.findUnique({ where: { id: original.id } })
    expect(dbOriginal).toBeNull()
  })

  it('returns 409 when the same user already owns an unverified site with this domain', async () => {
    const user = await createUser()
    const domain = `mydomain-${Date.now()}.com`
    await prisma.site.create({
      data: { name: 'Mine', domain, siteKey: `sk_${Date.now()}`, userId: user.id, verified: false },
    })

    const res = await request(app)
      .post('/api/sites')
      .set(authHeader(user.id))
      .send({ name: 'Duplicate', domain })

    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/sites/:id — cascade behavior', () => {
  it('deleting a site cascades to its widgets, commentWidget, and comments', async () => {
    const user = await createUser()
    const { site, widget } = await seedSiteWithWidget(user.id)
    const comment = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Hello',
        status: CommentStatus.approved,
        authorName: 'Someone',
      },
    })

    const res = await request(app).delete(`/api/sites/${site.id}`).set(authHeader(user.id))
    expect(res.status).toBe(200)

    const dbWidget = await prisma.widget.findUnique({ where: { id: widget.id } })
    const dbComment = await prisma.comment.findUnique({ where: { id: comment.id } })
    expect(dbWidget).toBeNull()
    expect(dbComment).toBeNull()
  })
})

describe('GET /api/sites/:id/export', () => {
  it('exports the site with its widgets and approved comments, excluding soft-deleted ones', async () => {
    const user = await createUser()
    const { site, widget } = await seedSiteWithWidget(user.id)
    await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Visible comment',
        status: CommentStatus.approved,
        authorName: 'Someone',
      },
    })
    await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Deleted comment',
        status: CommentStatus.approved,
        authorName: 'Someone',
        deletedAt: new Date(),
      },
    })

    const res = await request(app).get(`/api/sites/${site.id}/export`).set(authHeader(user.id))

    expect(res.status).toBe(200)
    const data = JSON.parse(res.text)
    expect(data.schemaVersion).toBe(1)
    expect(data.widgets).toHaveLength(1)
    expect(data.comments).toHaveLength(1)
    expect(data.comments[0].body).toBe('Visible comment')
  })
})

describe('POST /api/sites/import — full export/import round trip', () => {
  it('imports a previously exported site into a brand-new site with fresh IDs', async () => {
    const user = await createUser()
    const { site, widget } = await seedSiteWithWidget(user.id)

    const topLevel = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Top level comment',
        status: CommentStatus.approved,
        authorName: 'Alice',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    })
    await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'A reply',
        status: CommentStatus.approved,
        authorName: 'Bob',
        parentId: topLevel.id,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    })

    const exportRes = await request(app).get(`/api/sites/${site.id}/export`).set(authHeader(user.id))
    const exportData = JSON.parse(exportRes.text)

    const importRes = await request(app)
      .post('/api/sites/import')
      .set(authHeader(user.id))
      .send({ name: 'Imported Copy', domain: `imported-${Date.now()}.com`, data: exportData })

    expect(importRes.status).toBe(201)
    const newSiteId = importRes.body.id
    expect(newSiteId).not.toBe(site.id)

    const importedWidgets = await prisma.widget.findMany({ where: { siteId: newSiteId } })
    expect(importedWidgets).toHaveLength(1)
    expect(importedWidgets[0]!.widgetKey).not.toBe(widget.widgetKey)

    const importedComments = await prisma.comment.findMany({
      where: { commentWidgetId: (await prisma.commentWidget.findFirst({ where: { widgetId: importedWidgets[0]!.id } }))!.id },
    })
    expect(importedComments).toHaveLength(2)

    const importedParent = importedComments.find((c) => c.parentId === null)
    const importedReply = importedComments.find((c) => c.parentId !== null)
    expect(importedReply?.parentId).toBe(importedParent?.id)
  })

  it('drops the reply-to-parent link when the export lists a reply before its parent (order-dependent remap limitation)', async () => {
    const user = await createUser()
    const { site, widget } = await seedSiteWithWidget(user.id)

    const parent = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Parent',
        status: CommentStatus.approved,
        authorName: 'Alice',
      },
    })
    const reply = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/post',
        body: 'Reply',
        status: CommentStatus.approved,
        authorName: 'Bob',
        parentId: parent.id,
      },
    })

    const exportRes = await request(app).get(`/api/sites/${site.id}/export`).set(authHeader(user.id))
    const exportData = JSON.parse(exportRes.text)

    exportData.comments = [
      exportData.comments.find((c: any) => c.id === reply.id),
      exportData.comments.find((c: any) => c.id === parent.id),
    ]

    const importRes = await request(app)
      .post('/api/sites/import')
      .set(authHeader(user.id))
      .send({ name: 'Reordered Import', domain: `reordered-${Date.now()}.com`, data: exportData })

    expect(importRes.status).toBe(201)

    const importedComments = await prisma.comment.findMany({
      where: { widgetKey: { not: widget.widgetKey } },
      orderBy: { createdAt: 'asc' },
    })
    const importedReply = importedComments.find((c) => c.body === 'Reply')
    expect(importedReply?.parentId).toBeNull()
  })

  it('returns 400 when the export payload has an unsupported schemaVersion', async () => {
    const user = await createUser()

    const res = await request(app)
      .post('/api/sites/import')
      .set(authHeader(user.id))
      .send({
        name: 'Bad Import',
        domain: `badimport-${Date.now()}.com`,
        data: { schemaVersion: 2, site: { name: 'x', domain: 'x.com' }, widgets: [], comments: [] },
      })

    expect(res.status).toBe(400)
  })

  it('returns 409 when importing into a domain that is already verified', async () => {
    const owner = await createUser()
    const domain = `verified-target-${Date.now()}.com`
    await prisma.site.create({
      data: { name: 'Existing', domain, siteKey: `sk_${Date.now()}`, userId: owner.id, verified: true },
    })

    const importer = await createUser()
    const res = await request(app)
      .post('/api/sites/import')
      .set(authHeader(importer.id))
      .send({
        name: 'Colliding Import',
        domain,
        data: { schemaVersion: 1, site: { name: 'x', domain }, widgets: [], comments: [] },
      })

    expect(res.status).toBe(409)
  })
})

describe('PATCH /api/sites/:id/banned-words', () => {
  it('returns 404 when the site belongs to a different user', async () => {
    const user = await createUser()
    const otherUser = await createUser()
    const { site } = await seedSiteWithWidget(otherUser.id)

    const res = await request(app)
      .patch(`/api/sites/${site.id}/banned-words`)
      .set(authHeader(user.id))
      .send({ bannedWords: ['spam'] })

    expect(res.status).toBe(404)
  })

  it('updates bannedWords and autoDeleteBannedWords on the site', async () => {
    const user = await createUser()
    const { site } = await seedSiteWithWidget(user.id)

    const res = await request(app)
      .patch(`/api/sites/${site.id}/banned-words`)
      .set(authHeader(user.id))
      .send({ bannedWords: ['spam', 'scam'], autoDeleteBannedWords: true })

    expect(res.status).toBe(200)
    expect(res.body.bannedWords).toEqual(['spam', 'scam'])
    expect(res.body.autoDeleteBannedWords).toBe(true)

    const dbSite = await prisma.site.findUnique({ where: { id: site.id } })
    expect(dbSite?.bannedWords).toEqual(['spam', 'scam'])
    expect(dbSite?.autoDeleteBannedWords).toBe(true)
  })

  it('returns 401 without a session', async () => {
    const res = await request(app).patch('/api/sites/some_id/banned-words').send({ bannedWords: [] })
    expect(res.status).toBe(401)
  })
})
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

async function seedSiteWithWidget(ownerEmail = `owner_${Date.now()}_${Math.random()}@example.com`) {
  const user = await prisma.user.create({ data: { email: ownerEmail, name: 'Owner' } })
  const site = await prisma.site.create({
    data: { name: 'Test Site', domain: `example-${Date.now()}-${Math.random()}.com`, siteKey: 'sk_test', userId: user.id },
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
  return { user, site, widget }
}

async function seedComment(commentWidgetId: string, widgetKey: string, overrides: Partial<any> = {}) {
  return prisma.comment.create({
    data: {
      commentWidgetId,
      widgetKey,
      pageUrl: '/post',
      body: 'Hello',
      status: CommentStatus.pending,
      authorName: 'Commenter',
      ...overrides,
    },
  })
}

describe('requireAuth wiring', () => {
  it('returns 401 for GET /approved without a session', async () => {
    const res = await request(app).get('/api/comments/approved').query({ widget_key: 'wk_1' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for PATCH /:id/approve without a session', async () => {
    const res = await request(app).patch('/api/comments/some_id/approve')
    expect(res.status).toBe(401)
  })

  it('returns 401 for DELETE /:id without a session', async () => {
    const res = await request(app).delete('/api/comments/some_id')
    expect(res.status).toBe(401)
  })
})

describe('GET /api/comments/pending — ownership enforcement', () => {
  it('returns 404 when the widget belongs to a different user', async () => {
    const { widget } = await seedSiteWithWidget()
    const otherUser = await prisma.user.create({ data: { email: `other_${Date.now()}@example.com` } })

    const res = await request(app)
      .get('/api/comments/pending')
      .query({ widget_key: widget.widgetKey })
      .set(authHeader(otherUser.id))

    expect(res.status).toBe(404)
  })

  it('returns pending comments when the requesting user owns the widget', async () => {
    const { user, widget } = await seedSiteWithWidget()
    await seedComment(widget.commentWidget!.id, widget.widgetKey, { status: CommentStatus.pending })

    const res = await request(app)
      .get('/api/comments/pending')
      .query({ widget_key: widget.widgetKey })
      .set(authHeader(user.id))

    expect(res.status).toBe(200)
    expect(res.body.comments).toHaveLength(1)
  })
})

describe('PATCH /api/comments/:id/approve — cascade behavior', () => {
  it('approves a top-level comment and cascades approval to its replies', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey, { status: CommentStatus.pending })
    const reply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.pending,
      parentId: parent.id,
    })

    const res = await request(app)
      .patch(`/api/comments/${parent.id}/approve`)
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const dbReply = await prisma.comment.findUnique({ where: { id: reply.id } })
    expect(dbReply?.status).toBe(CommentStatus.approved)
  })

  it('returns 403 when a different user attempts to approve the comment', async () => {
    const { widget } = await seedSiteWithWidget()
    const comment = await seedComment(widget.commentWidget!.id, widget.widgetKey)
    const otherUser = await prisma.user.create({ data: { email: `other_${Date.now()}@example.com` } })

    const res = await request(app)
      .patch(`/api/comments/${comment.id}/approve`)
      .set(authHeader(otherUser.id))

    expect(res.status).toBe(403)
  })

  it('returns 404 when the comment does not exist', async () => {
    const { user } = await seedSiteWithWidget()

    const res = await request(app)
      .patch('/api/comments/does_not_exist/approve')
      .set(authHeader(user.id))

    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/comments/:id/reject — cascade behavior', () => {
  it('soft-deletes a top-level comment and cascades to its replies', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey, { status: CommentStatus.approved })
    const reply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      parentId: parent.id,
    })

    const res = await request(app)
      .patch(`/api/comments/${parent.id}/reject`)
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const dbParent = await prisma.comment.findUnique({ where: { id: parent.id } })
    const dbReply = await prisma.comment.findUnique({ where: { id: reply.id } })
    expect(dbParent?.deletedAt).not.toBeNull()
    expect(dbReply?.deletedAt).not.toBeNull()
  })
})

describe('PATCH /api/comments/:id/restore — cascade behavior', () => {
  it('restores a soft-deleted top-level comment and its cascade-deleted replies', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const now = new Date()
    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      deletedAt: now,
    })
    const reply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      parentId: parent.id,
      deletedAt: now,
      deletedByParent: true,
    })

    const res = await request(app)
      .patch(`/api/comments/${parent.id}/restore`)
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const dbParent = await prisma.comment.findUnique({ where: { id: parent.id } })
    const dbReply = await prisma.comment.findUnique({ where: { id: reply.id } })
    expect(dbParent?.deletedAt).toBeNull()
    expect(dbReply?.deletedAt).toBeNull()
  })
})

describe('DELETE /api/comments/:id/permanent — cascade behavior', () => {
  it('deletes the comment and all of its replies from the database', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey)
    const reply = await seedComment(widget.commentWidget!.id, widget.widgetKey, { parentId: parent.id })

    const res = await request(app)
      .delete(`/api/comments/${parent.id}/permanent`)
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const dbParent = await prisma.comment.findUnique({ where: { id: parent.id } })
    const dbReply = await prisma.comment.findUnique({ where: { id: reply.id } })
    expect(dbParent).toBeNull()
    expect(dbReply).toBeNull()
  })
})

describe('PATCH /api/comments/:id/pin and /unpin', () => {
  it('pins a top-level comment then unpins it', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const comment = await seedComment(widget.commentWidget!.id, widget.widgetKey, { status: CommentStatus.approved })

    const pinRes = await request(app)
      .patch(`/api/comments/${comment.id}/pin`)
      .set(authHeader(user.id))
    expect(pinRes.status).toBe(200)

    let dbWidget = await prisma.commentWidget.findUnique({ where: { id: widget.commentWidget!.id } })
    expect(dbWidget?.pinnedCommentId).toBe(comment.id)

    const unpinRes = await request(app)
      .patch('/api/comments/unpin')
      .query({ widget_key: widget.widgetKey })
      .set(authHeader(user.id))
    expect(unpinRes.status).toBe(200)

    dbWidget = await prisma.commentWidget.findUnique({ where: { id: widget.commentWidget!.id } })
    expect(dbWidget?.pinnedCommentId).toBeNull()
  })

  it('returns 400 when attempting to pin a reply', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey)
    const reply = await seedComment(widget.commentWidget!.id, widget.widgetKey, { parentId: parent.id })

    const res = await request(app)
      .patch(`/api/comments/${reply.id}/pin`)
      .set(authHeader(user.id))

    expect(res.status).toBe(400)
  })
})

describe('POST /api/comments/owner-post and /:id/owner-reply', () => {
  it('creates an approved owner comment directly on the widget', async () => {
    const { user, widget } = await seedSiteWithWidget()

    const res = await request(app)
      .post('/api/comments/owner-post')
      .set(authHeader(user.id))
      .send({ widget_key: widget.widgetKey, page_url: '/post', body: 'Owner note' })

    expect(res.status).toBe(200)
    expect(res.body.isOwnerReply).toBe(true)
    expect(res.body.status).toBe(CommentStatus.approved)
  })

  it('creates an owner reply to an existing comment', async () => {
    const { user, widget } = await seedSiteWithWidget()
    const comment = await seedComment(widget.commentWidget!.id, widget.widgetKey, { status: CommentStatus.approved })

    const res = await request(app)
      .post(`/api/comments/${comment.id}/owner-reply`)
      .set(authHeader(user.id))
      .send({ body: 'Thanks for the comment!' })

    expect(res.status).toBe(200)
    expect(res.body.parentId).toBe(comment.id)
    expect(res.body.isOwnerReply).toBe(true)
  })
})

describe('DELETE /api/comments/deleteAll', () => {
  it('permanently removes all soft-deleted comments for the widget', async () => {
    const { user, widget } = await seedSiteWithWidget()
    await seedComment(widget.commentWidget!.id, widget.widgetKey, { deletedAt: new Date() })
    await seedComment(widget.commentWidget!.id, widget.widgetKey, { status: CommentStatus.approved })

    const res = await request(app)
      .delete('/api/comments/deleteAll')
      .query({ widget_key: widget.widgetKey })
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const remaining = await prisma.comment.findMany({ where: { commentWidgetId: widget.commentWidget!.id } })
    expect(remaining).toHaveLength(1)
    expect(remaining[0]!.deletedAt).toBeNull()
  })
})

describe('DELETE /api/comments/:id/permanent — quoted comment handling', () => {
  it('marks quotedWasDeleted and nulls quotedId when the owner permanently deletes a quoted reply', async () => {
    const { user, widget } = await seedSiteWithWidget()

    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
    })
    const quotedReply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      parentId: parent.id,
    })
    const quotingReply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      parentId: parent.id,
      quotedId: quotedReply.id,
    })

    const res = await request(app)
      .delete(`/api/comments/${quotedReply.id}/permanent`)
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const dbQuoted = await prisma.comment.findUnique({ where: { id: quotedReply.id } })
    expect(dbQuoted).toBeNull()

    const dbQuoting = await prisma.comment.findUnique({ where: { id: quotingReply.id } })
    expect(dbQuoting?.quotedId).toBeNull()
    expect(dbQuoting?.quotedWasDeleted).toBe(true)
  })
})

describe('PATCH /api/comments/:id/reject — quoted comment left intact', () => {
  it('does not set quotedWasDeleted when the quoted comment is only soft-deleted', async () => {
    const { user, widget } = await seedSiteWithWidget()

    const parent = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
    })
    const quotedReply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      parentId: parent.id,
    })
    const quotingReply = await seedComment(widget.commentWidget!.id, widget.widgetKey, {
      status: CommentStatus.approved,
      parentId: parent.id,
      quotedId: quotedReply.id,
    })

    const res = await request(app)
      .patch(`/api/comments/${quotedReply.id}/reject`)
      .set(authHeader(user.id))

    expect(res.status).toBe(200)

    const dbQuoting = await prisma.comment.findUnique({ where: { id: quotingReply.id } })
    expect(dbQuoting?.quotedId).toBe(quotedReply.id)
    expect(dbQuoting?.quotedWasDeleted).toBe(false)
  })
})
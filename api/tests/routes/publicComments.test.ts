import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app.js'
import { prisma } from '../setup.js'
import { CommentStatus, WidgetType } from '../../src/generated/prisma/enums.js'
import { createHash, randomUUID } from 'crypto'

async function seedSiteWithWidget() {
  const user = await prisma.user.create({
    data: { 
      email: `owner_${Date.now()}_${Math.random()}@example.com`, 
      name: 'Site Owner' 
    },
  })
  const site = await prisma.site.create({
    data: {
      name: 'Test Site',
      domain: `example-${Date.now()}-${Math.random()}.com`,
      siteKey: `sk_${Date.now()}_${Math.random()}`,
      userId: user.id,
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
  return { user, site, widget }
}

describe('GET /api/public/comments', () => {
  it('returns approved comments for a widget', async () => {
    const { widget } = await seedSiteWithWidget()

    await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Hello world',
        status: CommentStatus.approved,
        authorName: 'Jane',
      },
    })

    const res = await request(app).get('/api/public/comments').query({ widget_key: widget.widgetKey })

    expect(res.status).toBe(200)
    expect(res.body.comments).toHaveLength(1)
    expect(res.body.comments[0].body).toBe('Hello world')
  })

  it('does not return pending comments', async () => {
    const { widget } = await seedSiteWithWidget()

    await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Awaiting moderation',
        status: CommentStatus.pending,
        authorName: 'Jane',
      },
    })

    const res = await request(app).get('/api/public/comments').query({ widget_key: widget.widgetKey })

    expect(res.status).toBe(200)
    expect(res.body.comments).toHaveLength(0)
  })

  it('returns 400 when widget_key is missing', async () => {
    const res = await request(app).get('/api/public/comments')
    expect(res.status).toBe(400)
  })

  it('returns 404 when widget_key does not match any widget', async () => {
    const res = await request(app).get('/api/public/comments').query({ widget_key: 'does_not_exist' })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/public/comments — rate limiting', () => {
  it('allows up to 2 comments within the burst window, then rejects the 3rd', async () => {
    const { widget, site } = await seedSiteWithWidget()

    const payload = {
      widget_key: widget.widgetKey,
      page_url: '/blog/post-1',
      body: 'Hello',
    }

    const res1 = await request(app)
      .post('/api/public/comments')
      .set('Origin', `https://${site.domain}`)
      .send(payload)
    const res2 = await request(app)
      .post('/api/public/comments')
      .set('Origin', `https://${site.domain}`)
      .send({ ...payload, body: 'Hello again' })
    const res3 = await request(app)
      .post('/api/public/comments')
      .set('Origin', `https://${site.domain}`)
      .send({ ...payload, body: 'One more' })

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(res3.status).toBe(429)
  })
})

function hashSecret(secret: string): string {
  return createHash('sha256')
    .update(secret)
    .digest('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
}

describe('DELETE /api/public/comments — quoted comment deletion', () => {
  it('marks quotedWasDeleted and nulls quotedId when the author deletes their own quoted reply', async () => {
    const { widget } = await seedSiteWithWidget()
    const secret = randomUUID()

    const parent = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Parent comment',
        status: CommentStatus.approved,
        authorName: 'Alice',
      },
    })
    const quotedReply = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Original reply',
        status: CommentStatus.approved,
        authorName: 'Bob',
        parentId: parent.id,
        commenterDisplayId: hashSecret(secret),
      },
    })
    const quotingReply = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Quoting reply',
        status: CommentStatus.approved,
        authorName: 'Carol',
        parentId: parent.id,
        quotedId: quotedReply.id,
      },
    })

    const res = await request(app)
      .delete('/api/public/comments')
      .send({ comment_id: quotedReply.id, commenter_secret: secret })

    expect(res.status).toBe(200)

    const dbQuoted = await prisma.comment.findUnique({ where: { id: quotedReply.id } })
    expect(dbQuoted).toBeNull()

    const dbQuoting = await prisma.comment.findUnique({ where: { id: quotingReply.id } })
    expect(dbQuoting?.quotedId).toBeNull()
    expect(dbQuoting?.quotedWasDeleted).toBe(true)
  })

  it('returns 403 and leaves everything untouched when the secret is wrong', async () => {
    const { widget } = await seedSiteWithWidget()

    const parent = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Parent comment',
        status: CommentStatus.approved,
        authorName: 'Alice',
      },
    })
    const quotedReply = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Original reply',
        status: CommentStatus.approved,
        authorName: 'Bob',
        parentId: parent.id,
        commenterDisplayId: hashSecret('real-secret'),
      },
    })
    const quotingReply = await prisma.comment.create({
      data: {
        commentWidgetId: widget.commentWidget!.id,
        widgetKey: widget.widgetKey,
        pageUrl: '/blog/post-1',
        body: 'Quoting reply',
        status: CommentStatus.approved,
        authorName: 'Carol',
        parentId: parent.id,
        quotedId: quotedReply.id,
      },
    })

    const res = await request(app)
      .delete('/api/public/comments')
      .send({ comment_id: quotedReply.id, commenter_secret: randomUUID() })

    expect(res.status).toBe(403)

    const dbQuoted = await prisma.comment.findUnique({ where: { id: quotedReply.id } })
    expect(dbQuoted).not.toBeNull()

    const dbQuoting = await prisma.comment.findUnique({ where: { id: quotingReply.id } })
    expect(dbQuoting?.quotedWasDeleted).toBe(false)
  })
})
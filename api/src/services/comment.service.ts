import sanitizeHtml from 'sanitize-html'
import prisma from '../lib/prisma.js'
import { AppError } from '../errors/appError.js'
import { getWidgetByKey } from './widget.service.js'
import { LIMITS, PLAN_LIMITS } from '../constants/index.js'
import { CommentStatus } from '../generated/prisma/enums.js'

async function getCommentAndVerifyOwnership(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) throw new AppError(404, 'Comment not found')

  const widget = await getWidgetByKey(comment.widgetKey)
  if (!widget || widget.site.userId !== userId) throw new AppError(403, 'Forbidden')

  return comment
}

export async function getApprovedComments(
  widgetKey: string,
  cursor?: string,
  skipQuota = false,
) {
  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget) throw new AppError(404, 'Widget not found')

  if (!skipQuota) {
    const userId = widget.site.userId
    const userPlan = widget.site.user.plan
    const limit = PLAN_LIMITS[userPlan]

    const { _sum } = await prisma.commentWidget.aggregate({
      _sum: { monthlyLoads: true },
      where: { widget: { site: { userId } } },
    })

    const totalLoads = _sum.monthlyLoads ?? 0
    if (totalLoads >= limit) throw new AppError(429, 'Monthly load limit reached')
  }

  const commentWidgetId = widget.commentWidget.id
  const pinnedCommentId = widget.commentWidget.pinnedCommentId

  const baseWhere: any = {
    commentWidgetId,
    status: CommentStatus.approved,
    deletedAt: null,
    parentId: null,
  }

  if (cursor) {
    const cursorComment = await prisma.comment.findUnique({ where: { id: cursor } })
    if (cursorComment) baseWhere.createdAt = { lt: cursorComment.createdAt }
  }

  const countWhere: any = {
    commentWidgetId,
    status: CommentStatus.approved,
    deletedAt: null,
    parentId: null,
  }

  const replyCountWhere: any = {
    commentWidgetId,
    status: CommentStatus.approved,
    deletedAt: null,
    parentId: { not: null },
  }

  const [topLevelTotal, replyTotal, comments] = await Promise.all([
    prisma.comment.count({ where: countWhere }),
    prisma.comment.count({ where: replyCountWhere }),
    prisma.comment.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: LIMITS.COMMENT_PAGE_SIZE,
      include: {
        replies: {
          where: { status: CommentStatus.approved, deletedAt: null },
          orderBy: { createdAt: 'asc' },
          include: {
            quoted: {
              select: { id: true, body: true, deletedAt: true, status: true },
            },
          },
        },
      },
    }),
  ])

  if (!skipQuota) {
    await prisma.commentWidget.update({
      where: { id: widget.commentWidget.id },
      data: { monthlyLoads: { increment: 1 } },
    })
  }

  let ordered = comments
  if (pinnedCommentId && !cursor) {
    const pinned = comments.find(c => c.id === pinnedCommentId)
    if (pinned) {
      ordered = [pinned, ...comments.filter(c => c.id !== pinnedCommentId)]
    }
  }

  return {
    comments: ordered,
    hasMore: comments.length === LIMITS.COMMENT_PAGE_SIZE,
    total: topLevelTotal + replyTotal,
    pinnedCommentId,
  }
}

export async function getPendingComments(widgetKey: string, userId: string) {
  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget || widget.site.userId !== userId) {
    throw new AppError(404, 'Widget not found')
  }

  const commentWidgetId = widget.commentWidget.id

  const [comments, orphanedReplies] = await Promise.all([
    prisma.comment.findMany({
      where: { commentWidgetId, status: CommentStatus.pending, deletedAt: null, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        replies: {
          where: { status: CommentStatus.pending, deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.comment.findMany({
      where: {
        commentWidgetId,
        status: CommentStatus.pending,
        deletedAt: null,
        parentId: { not: null },
        parent: { status: { not: CommentStatus.pending } },
      },
      include: { parent: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return { comments, orphanedReplies }
}

export async function getDeletedComments(widgetKey: string, userId: string) {
  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget || widget.site.userId !== userId) {
    throw new AppError(404, 'Widget not found')
  }

  const commentWidgetId = widget.commentWidget.id

  const [comments, orphanedReplies] = await Promise.all([
    prisma.comment.findMany({
      where: { commentWidgetId, deletedAt: { not: null }, parentId: null },
      orderBy: { deletedAt: 'desc' },
      include: {
        replies: {
          where: { deletedAt: { not: null } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.comment.findMany({
      where: {
        commentWidgetId,
        deletedAt: { not: null },
        parentId: { not: null },
        parent: { deletedAt: null },
      },
      include: { parent: true },
      orderBy: { deletedAt: 'desc' },
    }),
  ])

  return { comments, orphanedReplies }
}

export async function createComment(
  widgetKey: string,
  pageUrl: string,
  rawBody: string,
  parentId: string | undefined,
  quotedId: string | undefined,
  origin: string,
) {
  const cleanBody = sanitizeHtml(rawBody, { allowedTags: [], allowedAttributes: {} })
  if (!cleanBody || cleanBody.trim().length === 0) throw new AppError(400, 'Comment body is required')
  if (cleanBody.length > LIMITS.COMMENT_MAX_LENGTH) throw new AppError(400, `Comment must be under ${LIMITS.COMMENT_MAX_LENGTH} characters`)

  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget) throw new AppError(404, 'Invalid widget key')

  let isLocalhost = false
  try {
    const originHostname = new URL(origin).hostname
    isLocalhost = originHostname === 'localhost' || originHostname === '127.0.0.1'

    if (!isLocalhost) {
      const siteHostname = new URL(`https://${widget.site.domain}`).hostname
      if (originHostname !== siteHostname) throw new AppError(403, 'Domain not allowed')
    }
  } catch (e) {
    if (e instanceof AppError) throw e
    throw new AppError(403, 'Domain not allowed')
  }

  if (!widget.site.verified && !isLocalhost) {
    await prisma.site.update({
      where: { id: widget.site.id },
      data: { verified: true },
    })
  }

  const bannedWords: string[] = widget.commentWidget.bannedWords ?? []
  const autoDelete = widget.commentWidget.autoDeleteBannedWords
  let processedBody = cleanBody

  if (bannedWords.length > 0) {
    const lowerBody = cleanBody.toLowerCase()
    const hasBannedWord = bannedWords.some(word => lowerBody.includes(word.toLowerCase()))

    if (hasBannedWord) {
      if (autoDelete) throw new AppError(400, 'Your comment contains prohibited words.')
      bannedWords.forEach(word => {
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
        processedBody = processedBody.replace(regex, '*'.repeat(word.length))
      })
    }
  }

  if (parentId) {
    const parent = await prisma.comment.findUnique({ where: { id: parentId } })
    if (!parent) throw new AppError(404, 'Parent comment not found')
    if (parent.commentWidgetId !== widget.commentWidget.id) throw new AppError(403, 'Parent comment does not belong to this widget')
    if (parent.parentId) throw new AppError(400, 'Cannot reply to a reply')
    if (parent.deletedAt) throw new AppError(400, 'Cannot reply to a deleted comment')
  }

  if (quotedId) {
    const quoted = await prisma.comment.findUnique({ where: { id: quotedId } })
    if (!quoted) throw new AppError(404, 'Quoted comment not found')
    if (quoted.commentWidgetId !== widget.commentWidget.id) throw new AppError(403, 'Quoted comment does not belong to this widget')
    if (!quoted.parentId) throw new AppError(400, 'Can only quote a reply')
  }

  return prisma.comment.create({
    data: {
      commentWidgetId: widget.commentWidget.id,
      widgetKey,
      pageUrl,
      body: processedBody,
      status: widget.commentWidget.autoApprove ? CommentStatus.approved : CommentStatus.pending,
      parentId: parentId ?? null,
      quotedId: quotedId ?? null,
    },
    include: {
      quoted: {
        select: { id: true, body: true, deletedAt: true, status: true },
      },
    },
  })
}

export async function approveComment(commentId: string, userId: string) {
  const comment = await getCommentAndVerifyOwnership(commentId, userId)

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { status: CommentStatus.approved },
  })

  if (!comment.parentId) {
    await prisma.comment.updateMany({
      where: { parentId: commentId, deletedAt: null },
      data: { status: CommentStatus.approved },
    })
  }

  return updated
}

export async function rejectComment(commentId: string, userId: string) {
  const comment = await getCommentAndVerifyOwnership(commentId, userId)
  const now = new Date()

  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt: now } })

  if (!comment.parentId) {
    await prisma.comment.updateMany({
      where: { parentId: commentId },
      data: { deletedAt: now },
    })
  }
}

export async function restoreComment(commentId: string, userId: string) {
  const comment = await getCommentAndVerifyOwnership(commentId, userId)

  await prisma.comment.update({
    where: { id: commentId },
    data: { deletedAt: null, status: CommentStatus.approved },
  })

  if (!comment.parentId) {
    await prisma.comment.updateMany({
      where: { parentId: commentId, deletedByParent: true },
      data: { deletedAt: null, deletedByParent: false, status: CommentStatus.approved },
    })
  }
}

export async function softDeleteComment(commentId: string, userId: string) {
  const comment = await getCommentAndVerifyOwnership(commentId, userId)
  const deletedAt = new Date()

  await prisma.comment.update({ where: { id: commentId }, data: { deletedAt } })

  if (!comment.parentId) {
    await prisma.comment.updateMany({
      where: { parentId: commentId, deletedAt: null },
      data: { deletedAt, deletedByParent: true },
    })
  }
}

export async function permanentDeleteComment(commentId: string, userId: string) {
  await getCommentAndVerifyOwnership(commentId, userId)
  await prisma.comment.deleteMany({ where: { parentId: commentId } })
  await prisma.comment.delete({ where: { id: commentId } })
}

export async function permanentDeleteAllDeleted(widgetKey: string, userId: string) {
  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget || widget.site.userId !== userId) {
    throw new AppError(404, 'Widget not found')
  }

  await prisma.comment.deleteMany({
    where: { commentWidgetId: widget.commentWidget.id, deletedAt: { not: null } },
  })
}

export async function createOwnerReply(
  commentId: string,
  rawBody: string,
  userId: string,
) {
  const cleanBody = sanitizeHtml(rawBody, { allowedTags: [], allowedAttributes: {} })
  if (!cleanBody || cleanBody.trim().length === 0) throw new AppError(400, 'Reply body is required')
  if (cleanBody.length > LIMITS.COMMENT_MAX_LENGTH) throw new AppError(400, `Reply must be under ${LIMITS.COMMENT_MAX_LENGTH} characters`)

  const parent = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!parent) throw new AppError(404, 'Comment not found')
  if (parent.deletedAt) throw new AppError(400, 'Cannot reply to a deleted comment')

  // Resolve to top-level comment
  const topLevelId = parent.parentId ?? parent.id
  const topLevel = parent.parentId
    ? await prisma.comment.findUnique({ where: { id: parent.parentId } })
    : parent
  if (!topLevel) throw new AppError(404, 'Parent comment not found')

  const widget = await getWidgetByKey(topLevel.widgetKey)
  if (!widget || widget.site.userId !== userId) throw new AppError(403, 'Forbidden')

  return prisma.comment.create({
    data: {
      commentWidgetId: topLevel.commentWidgetId,
      widgetKey: topLevel.widgetKey,
      pageUrl: topLevel.pageUrl,
      body: cleanBody,
      status: CommentStatus.approved,
      parentId: topLevelId,
      isOwnerReply: true,
      quotedId: parent.parentId ? commentId : null,
    },
    include: {
      quoted: {
        select: { id: true, body: true, deletedAt: true, status: true },
      },
    },
  })
}

export async function createOwnerComment(
  widgetKey: string,
  pageUrl: string,
  rawBody: string,
  userId: string,
) {
  const cleanBody = sanitizeHtml(rawBody, { allowedTags: [], allowedAttributes: {} })
  if (!cleanBody || cleanBody.trim().length === 0) throw new AppError(400, 'Body is required')
  if (cleanBody.length > LIMITS.COMMENT_MAX_LENGTH) throw new AppError(400, `Comment must be under ${LIMITS.COMMENT_MAX_LENGTH} characters`)

  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget) throw new AppError(404, 'Widget not found')
  if (widget.site.userId !== userId) throw new AppError(403, 'Forbidden')

  return prisma.comment.create({
    data: {
      commentWidgetId: widget.commentWidget.id,
      widgetKey,
      pageUrl,
      body: cleanBody,
      status: CommentStatus.approved,
      isOwnerReply: true,
    },
  })
}

export async function pinComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!comment) throw new AppError(404, 'Comment not found')
  if (comment.parentId) throw new AppError(400, 'Cannot pin a reply')

  const widget = await getWidgetByKey(comment.widgetKey)
  if (!widget?.commentWidget || widget.site.userId !== userId) throw new AppError(403, 'Forbidden')

  return prisma.commentWidget.update({
    where: { id: widget.commentWidget.id },
    data: { pinnedCommentId: commentId },
  })
}

export async function unpinComment(widgetKey: string, userId: string) {
  const widget = await getWidgetByKey(widgetKey)
  if (!widget?.commentWidget || widget.site.userId !== userId) throw new AppError(403, 'Forbidden')

  return prisma.commentWidget.update({
    where: { id: widget.commentWidget.id },
    data: { pinnedCommentId: null },
  })
}
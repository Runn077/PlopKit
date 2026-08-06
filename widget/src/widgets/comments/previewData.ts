import type { Comment, CommentsResponse, NewComment, Reply } from '../../types'

export function getFixtureComments(): CommentsResponse {
  return {
    pinnedCommentId: 'preview-pinned',
    pinnedComment: {
      id: 'preview-pinned',
      body: 'This is what a comment looks like with your current theme.',
      authorName: 'Site Owner',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      isOwnerReply: true,
      commenterDisplayId: null,
      replies: [],
    },
    comments: [
      {
        id: 'preview-1',
        body: 'This is what a comment looks like with your current theme.',
        authorName: 'Jane Doe',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        isOwnerReply: false,
        commenterDisplayId: 'preview-you',
        replies: [
          {
            id: 'preview-reply-1',
            body: 'And this is a reply to that comment.',
            authorName: 'John Smith',
            createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
            quotedId: 'preview-1',
            quoted: {
              id: 'preview-1',
              body: 'This is what a comment looks like with your current theme.',
              deletedAt: null,
              status: 'approved',
              commenterDisplayId: 'preview-you',
              isOwnerReply: false,
            },
            isOwnerReply: false,
            commenterDisplayId: 'ef56gh78',
          },
        ],
      },
    ],
    hasMore: false,
    total: 2,
  }
}

let fakeIdCounter = 0
function fakeId() {
  fakeIdCounter += 1
  return `preview-fake-${fakeIdCounter}`
}

export function fakePost(body: string, authorName: string): NewComment {
  return {
    id: fakeId(),
    body,
    authorName: authorName || 'You',
    createdAt: new Date().toISOString(),
    status: 'approved',
    parentId: null,
    quotedId: null,
    quoted: null,
    isOwnerReply: false,
    commenterDisplayId: 'preview-you',
  }
}

export function fakeReply(body: string, authorName: string, quotedId?: string): Reply & { status: 'approved' } {
  return {
    id: fakeId(),
    body,
    authorName: authorName || 'You',
    createdAt: new Date().toISOString(),
    quotedId: quotedId ?? null,
    quoted: null,
    isOwnerReply: false,
    commenterDisplayId: 'preview-you',
    status: 'approved',
  }
}
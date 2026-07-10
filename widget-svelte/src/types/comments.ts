export interface QuotedComment {
  id?: string
  body: string
  deletedAt: string | null
  status: 'approved' | 'pending'
  commenterDisplayId: string | null
  isOwnerReply: boolean
}

export interface Reply {
  id: string
  body: string
  authorName: string
  createdAt: string
  quotedId: string | null
  quoted: QuotedComment | null
  isOwnerReply: boolean
  commenterDisplayId: string | null
}

export interface Comment {
  id: string
  body: string
  authorName: string
  createdAt: string
  replies: Reply[]
  isOwnerReply: boolean
  commenterDisplayId: string | null
}

export interface NewComment {
  id: string
  body: string
  authorName: string
  createdAt: string
  status: 'approved' | 'pending'
  parentId: string | null
  quotedId: string | null
  quoted: QuotedComment | null
  isOwnerReply: boolean
  commenterDisplayId: string | null
}

export interface CommentsResponse {
  pinnedComment: Comment | null
  comments: Comment[]
  hasMore: boolean
  total: number
  pinnedCommentId: string | null
}
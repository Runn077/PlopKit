export interface CommentWidget {
  id: string
  widgetId: string
  autoApprove: boolean
  bannedWords: string[]
  autoDeleteBannedWords: boolean
  pinnedCommentId: string | null
  createdAt: string
}

export interface Widget {
  id: string
  type: string
  name: string
  widgetKey: string
  siteId: string
  commentWidget: CommentWidget | null
  monthlyLoads: number
  createdAt: string
}

export interface QuotedComment {
  id: string
  body: string
  deletedAt: string | null
  status: string
}

export interface Reply {
  id: string
  body: string
  status: string
  parentId: string
  deletedAt?: string | null
  createdAt: string
  parent?: { body: string }
  quotedId: string | null
  quoted: QuotedComment | null
  isOwnerReply: boolean
}

export interface Comment {
  id: string
  body: string
  pageUrl: string
  status: string
  deletedAt?: string | null
  createdAt: string
  replies: Reply[]
  isOwnerReply: boolean
}

export interface Site {
  id: string
  name: string
  domain: string
  siteKey: string
  verified: boolean
  expiresAt?: string | null
  createdAt: string
}
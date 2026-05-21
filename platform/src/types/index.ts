export interface CommentWidget {
  id: string
  widgetId: string
  autoApprove: boolean
  bannedWords: string[]
  autoDeleteBannedWords: boolean
  createdAt: string
}

export interface Widget {
  id: string
  type: string
  name: string
  widgetKey: string
  siteId: string
  commentWidget: CommentWidget | null
  createdAt: string
}

export interface Reply {
  id: string
  body: string
  status: string
  parentId: string
  deletedAt?: string | null
  createdAt: string
  parent?: { body: string }
}

export interface Comment {
  id: string
  body: string
  pageUrl: string
  status: string
  deletedAt?: string | null
  createdAt: string
  replies: Reply[]
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
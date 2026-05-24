export interface QuotedComment {
  id: string
  body: string
  deletedAt: string | null
  status: 'approved' | 'pending'
}

export interface Reply {
  id: string
  body: string
  createdAt: string
  quotedId: string | null
  quoted: QuotedComment | null
  isOwnerReply: boolean
}

export interface Comment {
  id: string
  body: string
  createdAt: string
  replies: Reply[]
  isOwnerReply: boolean
}

export interface NewComment {
  id: string
  body: string
  createdAt: string
  status: 'approved' | 'pending'
  parentId: string | null
  quotedId: string | null
  quoted: QuotedComment | null
  isOwnerReply: boolean
}
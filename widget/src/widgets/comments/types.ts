export interface Reply {
  id: string
  body: string
  createdAt: string
}

export interface Comment {
  id: string
  body: string
  createdAt: string
  replies: Reply[]
}

export interface NewComment {
  id: string
  body: string
  createdAt: string
  status: 'approved' | 'pending'
  parentId: string | null
}
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

export interface Widget {
  id: string
  type: string
  name: string
  widgetKey: string
  siteId: string
  createdAt: string
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

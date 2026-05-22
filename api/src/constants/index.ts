export const COMMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
} as const

export const PROVIDER_IDS = {
  CREDENTIAL: 'credential',
} as const

export const LIMITS = {
  COMMENT_MAX_LENGTH: 1000,
  COMMENT_PAGE_SIZE: 20,
  SITE_EXPIRY_DAYS: 7,
  SOFT_DELETE_EXPIRY_DAYS: 7,
  PENDING_EXPIRY_DAYS: 30,
} as const
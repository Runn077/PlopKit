export const LIMITS = {
  COMMENT_MAX_LENGTH: 1000,
  COMMENT_PAGE_SIZE: 20,
  PENDING_PAGE_SIZE: 30,
  DELETED_PAGE_SIZE: 30,
  SOFT_DELETE_EXPIRY_DAYS: 7,
  PENDING_EXPIRY_DAYS: 30,
} as const

export const PLAN_LIMITS = {
  free:  10_000,
  hobby: 120_000,
  pro:   400_000,
} as const
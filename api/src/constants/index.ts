export const LIMITS = {
  COMMENT_MAX_LENGTH: 2500,
  COMMENT_PAGE_SIZE: 20,
  PENDING_PAGE_SIZE: 30,
  DELETED_PAGE_SIZE: 30,
  SOFT_DELETE_EXPIRY_DAYS: 7,
  PENDING_EXPIRY_DAYS: 30,
} as const

export const PLAN_LIMITS = {
  free:  5_000,
  hobby: 150_000,
  pro:   500_000,
} as const
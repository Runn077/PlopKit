export const LIMITS = {
  COMMENT_MAX_LENGTH: 1000,
  COMMENT_PAGE_SIZE: 20,
  SOFT_DELETE_EXPIRY_DAYS: 7,
  PENDING_EXPIRY_DAYS: 30,
} as const

export const PLAN_LIMITS = {
  free:  10_000,
  hobby: 150_000,
  pro:   500_000,
} as const
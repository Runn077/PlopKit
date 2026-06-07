import { z } from 'zod'
import { LIMITS } from '../constants/index.js'

export const getCommentsSchema = z.object({
  widget_key: z.string().min(1, 'Widget key is required'),
  page_url: z.string().optional(),
  cursor: z.string().optional(),
})

export const getWidgetCommentsSchema = z.object({
  widget_key: z.string().min(1, 'Widget key is required'),
  cursor: z.string().optional(),
})

export const createCommentSchema = z.object({
  widget_key: z.string().min(1, 'Widget key is required'),
  page_url: z.string().min(1, 'Page URL is required'),
  body: z.string().min(1, 'Comment body is required').max(
    LIMITS.COMMENT_MAX_LENGTH,
    `Comment must be under ${LIMITS.COMMENT_MAX_LENGTH} characters`
  ),
  parent_id: z.string().optional(),
  quoted_id: z.string().optional(),
})

export const ownerPostSchema = z.object({
  body: z.string().min(1, 'Body is required').max(
    LIMITS.COMMENT_MAX_LENGTH,
    `Comment must be under ${LIMITS.COMMENT_MAX_LENGTH} characters`
  ),
  page_url: z.string().min(1, 'Page URL is required'),
  widget_key: z.string().min(1, 'Widget key is required'),
})

export const updateBannedWordsSchema = z.object({
  bannedWords: z.array(z.string()).optional(),
  autoDeleteBannedWords: z.boolean().optional(),
})
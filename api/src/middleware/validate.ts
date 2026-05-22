import type { Request, Response, NextFunction } from 'express'
import { type ZodType } from 'zod'

type Target = 'body' | 'query' | 'params'

export function validate(schema: ZodType, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target])
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? 'Invalid input'
      res.status(400).json({ error: message })
      return
    }
    // Avoid direct assignment for req.query and req.params (readonly in Express)
    if (target === 'body') {
      req.body = result.data
    } else {
      Object.assign(req[target], result.data)
    }
    next()
  }
}
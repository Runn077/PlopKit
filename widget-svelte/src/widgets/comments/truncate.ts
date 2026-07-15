export const TRUNCATE_CHAR_LIMIT = 300
export const TRUNCATE_MAX_LINES = 3

export function getTruncatedBody(body: string, expanded: boolean) {
  const lines = body.split('\n')
  const isLong = body.length > TRUNCATE_CHAR_LIMIT || lines.length > TRUNCATE_MAX_LINES

  const displayBody = expanded || !isLong
    ? body
    : lines.length > TRUNCATE_MAX_LINES
      ? lines.slice(0, TRUNCATE_MAX_LINES).join('\n') + '...'
      : body.slice(0, TRUNCATE_CHAR_LIMIT) + '...'

  return { displayBody, isLong }
}
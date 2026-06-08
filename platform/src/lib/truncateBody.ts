const BODY_LIMIT = 300
const MAX_LINES = 3

export function truncateBody(body: string, expanded: boolean) {
  const lines = body.split('\n')
  const isLong = body.length > BODY_LIMIT || lines.length > MAX_LINES
  if (expanded || !isLong) return { displayBody: body, isLong }
  const displayBody = lines.length > MAX_LINES
    ? lines.slice(0, MAX_LINES).join('\n') + '...'
    : body.slice(0, BODY_LIMIT) + '...'
  return { displayBody, isLong }
}

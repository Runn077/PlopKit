import type { Reply } from './types'

interface Props {
  reply: Reply
  widgetKey: string
  pageUrl: string
}

export default function ReplyItem({ reply }: Props) {
  return (
    <div className="reply">
      <p className="reply-body">{reply.body}</p>
      <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
    </div>
  )
}
interface Reply {
  id: string
  body: string
  createdAt: string
}

interface Props {
  reply: Reply
}

export default function ReplyItem({ reply }: Props) {
  return (
    <div className="reply">
      <p className="reply-body">{reply.body}</p>
      <span className="reply-time">{new Date(reply.createdAt).toLocaleString()}</span>
    </div>
  )
}
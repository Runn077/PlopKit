<script lang="ts">
  import CommentsRenderer from '../renderer/CommentsRenderer.svelte'
  import { getFixtureComments, fakePost, fakeReply } from '../previewData'
  import type { Comment, NewComment, Reply } from '../../../types'

  export interface Props {
    widgetKey: string
    ownDisplayId: string | null
  }

  let { widgetKey, ownDisplayId }: Props = $props()

  const fixture = getFixtureComments()
  let comments = $state<Comment[]>(fixture.comments)
  let pinnedComment = $state<Comment | null>(fixture.pinnedComment)
  let total = $state(fixture.total)

  async function handlePost(body: string, authorName: string): Promise<NewComment> {
    return fakePost(body, authorName)
  }

  async function handlePostReply(
    _parentId: string,
    body: string,
    authorName: string,
    quotedId?: string
  ): Promise<Reply & { status: 'approved' | 'pending' }> {
    return fakeReply(body, authorName, quotedId)
  }

  async function handleDeleteReply(_replyId: string): Promise<void> {
  }
</script>

<CommentsRenderer
  {widgetKey}
  {comments}
  {pinnedComment}
  hasMore={false}
  loading={false}
  {total}
  limitReached={false}
  {ownDisplayId}
  onLoadMore={() => {}}
  onPost={handlePost}
  onDeleteComment={async () => {}}
  onPostReply={handlePostReply}
  onDeleteReply={handleDeleteReply}
/>
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_commentWidgetId_fkey";

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_commentWidgetId_fkey" FOREIGN KEY ("commentWidgetId") REFERENCES "CommentWidget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

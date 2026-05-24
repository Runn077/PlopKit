/*
  Warnings:

  - A unique constraint covering the columns `[pinnedCommentId]` on the table `CommentWidget` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CommentWidget" ADD COLUMN     "pinnedCommentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CommentWidget_pinnedCommentId_key" ON "CommentWidget"("pinnedCommentId");

-- AddForeignKey
ALTER TABLE "CommentWidget" ADD CONSTRAINT "CommentWidget_pinnedCommentId_fkey" FOREIGN KEY ("pinnedCommentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

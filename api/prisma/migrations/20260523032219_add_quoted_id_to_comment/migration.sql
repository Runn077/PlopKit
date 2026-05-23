-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "quotedId" TEXT;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_quotedId_fkey" FOREIGN KEY ("quotedId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

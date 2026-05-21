-- AlterTable
ALTER TABLE "CommentWidget" ADD COLUMN     "autoDeleteBannedWords" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannedWords" TEXT[] DEFAULT ARRAY[]::TEXT[];

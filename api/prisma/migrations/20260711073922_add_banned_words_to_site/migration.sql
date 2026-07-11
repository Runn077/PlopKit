/*
  Warnings:

  - You are about to drop the column `autoDeleteBannedWords` on the `CommentWidget` table. All the data in the column will be lost.
  - You are about to drop the column `bannedWords` on the `CommentWidget` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommentWidget" DROP COLUMN "autoDeleteBannedWords",
DROP COLUMN "bannedWords";

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "autoDeleteBannedWords" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannedWords" TEXT[] DEFAULT ARRAY[]::TEXT[];

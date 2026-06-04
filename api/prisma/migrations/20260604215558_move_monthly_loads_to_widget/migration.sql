/*
  Warnings:

  - You are about to drop the column `monthlyLoads` on the `CommentWidget` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommentWidget" DROP COLUMN "monthlyLoads";

-- AlterTable
ALTER TABLE "Widget" ADD COLUMN     "monthlyLoads" INTEGER NOT NULL DEFAULT 0;

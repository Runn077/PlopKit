/*
  Warnings:

  - The `status` column on the `Comment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `commentWidgetId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Widget` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('comments');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('pending', 'approved');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_widgetKey_fkey";

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "commentWidgetId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "CommentStatus" NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE "Widget" DROP COLUMN "type",
ADD COLUMN     "type" "WidgetType" NOT NULL;

-- CreateTable
CREATE TABLE "CommentWidget" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentWidget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentWidget_widgetId_key" ON "CommentWidget"("widgetId");

-- AddForeignKey
ALTER TABLE "CommentWidget" ADD CONSTRAINT "CommentWidget_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "Widget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_commentWidgetId_fkey" FOREIGN KEY ("commentWidgetId") REFERENCES "CommentWidget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `siteKey` on the `Comment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[widgetKey]` on the table `Widget` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `widgetKey` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `widgetKey` to the `Widget` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_siteKey_fkey";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "siteKey",
ADD COLUMN     "widgetKey" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Widget" ADD COLUMN     "widgetKey" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Widget_widgetKey_key" ON "Widget"("widgetKey");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_widgetKey_fkey" FOREIGN KEY ("widgetKey") REFERENCES "Widget"("widgetKey") ON DELETE RESTRICT ON UPDATE CASCADE;

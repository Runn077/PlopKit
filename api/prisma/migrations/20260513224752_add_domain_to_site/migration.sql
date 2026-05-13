/*
  Warnings:

  - Added the required column `domain` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "domain" TEXT NOT NULL;

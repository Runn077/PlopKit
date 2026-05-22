-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "deletedByParent" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'hobby', 'pro');

-- AlterTable
ALTER TABLE "CommentWidget" ADD COLUMN     "monthlyLoads" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'free';

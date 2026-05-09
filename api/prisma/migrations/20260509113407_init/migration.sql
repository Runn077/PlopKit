-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "siteKey" TEXT NOT NULL,
    "domain" TEXT NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "siteKey" TEXT NOT NULL,
    "pageUrl" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_siteKey_key" ON "Site"("siteKey");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_siteKey_fkey" FOREIGN KEY ("siteKey") REFERENCES "Site"("siteKey") ON DELETE RESTRICT ON UPDATE CASCADE;

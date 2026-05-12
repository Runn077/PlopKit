-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_siteKey_fkey" FOREIGN KEY ("siteKey") REFERENCES "Site"("siteKey") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "public"."CrawlState" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "lastIndex" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrawlState_domain_key" ON "public"."CrawlState"("domain");

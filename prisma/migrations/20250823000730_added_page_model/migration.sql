-- CreateTable
CREATE TABLE "public"."Page" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "lastScraped" TIMESTAMP(3),
    "status" TEXT,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_url_key" ON "public"."Page"("url");

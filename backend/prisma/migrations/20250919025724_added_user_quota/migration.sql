-- CreateTable
CREATE TABLE "public"."UserQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "messages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserQuota_userId_key" ON "public"."UserQuota"("userId");

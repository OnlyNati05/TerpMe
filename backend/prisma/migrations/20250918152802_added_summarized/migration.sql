-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "public"."Message" ADD COLUMN     "summarized" BOOLEAN NOT NULL DEFAULT false;

/*
  Warnings:

  - You are about to drop the column `contentHash` on the `Page` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Page" DROP COLUMN "contentHash";

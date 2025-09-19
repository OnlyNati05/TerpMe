/*
  Warnings:

  - Added the required column `updatedAt` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('user', 'assistant');

-- AlterTable
ALTER TABLE "public"."Conversation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

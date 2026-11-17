/*
  Warnings:

  - Changed the type of `type` on the `LLMProvider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LLMProviderType" AS ENUM ('magpie', 'mock');

-- AlterTable
ALTER TABLE "LLMProvider" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "secretRef" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "LLMProviderType" NOT NULL;

-- CreateTable
CREATE TABLE "SecretCredential" (
    "id" TEXT NOT NULL,
    "ref" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT,
    "algorithm" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecretCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SecretCredential_ref_key" ON "SecretCredential"("ref");

-- CreateIndex
CREATE INDEX "LLMProvider_projectId_isDefault_idx" ON "LLMProvider"("projectId", "isDefault");

-- CreateIndex
CREATE INDEX "LLMProvider_deletedAt_idx" ON "LLMProvider"("deletedAt");

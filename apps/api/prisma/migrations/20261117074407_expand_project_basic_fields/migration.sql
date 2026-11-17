-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "coverAssetId" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'zh-CN',
ADD COLUMN     "logline" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pov" TEXT,
ADD COLUMN     "premise" TEXT,
ADD COLUMN     "protagonist" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'planning',
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "targetAudience" TEXT,
ADD COLUMN     "targetLength" TEXT,
ADD COLUMN     "tone" TEXT;

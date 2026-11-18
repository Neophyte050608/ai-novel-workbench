-- Narrow WorldItem to generic world settings without migrating historical data.
-- Existing enum values remain for compatibility with legacy rows.
ALTER TYPE "WorldItemType" ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE "WorldItemType" ADD VALUE IF NOT EXISTS 'culture';
ALTER TYPE "WorldItemType" ADD VALUE IF NOT EXISTS 'concept';
ALTER TYPE "WorldItemType" ADD VALUE IF NOT EXISTS 'social_system';

ALTER TABLE "WorldItem" ADD COLUMN "visibility" TEXT;
ALTER TABLE "WorldItem" ADD COLUMN "sourceType" TEXT;
ALTER TABLE "WorldItem" ADD COLUMN "sourceId" TEXT;

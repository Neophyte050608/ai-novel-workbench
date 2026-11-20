import type { Prisma } from '@prisma/client';

export class UpdateSceneSummaryDto {
  sceneVersionId?: string | null;
  summary?: string;
  keyEvents?: Prisma.InputJsonValue;
  characterChanges?: Prisma.InputJsonValue;
  locationChanges?: Prisma.InputJsonValue;
  factionChanges?: Prisma.InputJsonValue;
  worldRuleChanges?: Prisma.InputJsonValue;
  newFacts?: Prisma.InputJsonValue;
  readerVisibleInfo?: Prisma.InputJsonValue;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

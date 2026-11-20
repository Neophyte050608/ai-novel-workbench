import type { Prisma } from '@prisma/client';

export class CreateSceneSummaryDto {
  sceneVersionId?: string;
  summary!: string;
  keyEvents?: Prisma.InputJsonValue;
  characterChanges?: Prisma.InputJsonValue;
  locationChanges?: Prisma.InputJsonValue;
  factionChanges?: Prisma.InputJsonValue;
  worldRuleChanges?: Prisma.InputJsonValue;
  newFacts?: Prisma.InputJsonValue;
  readerVisibleInfo?: Prisma.InputJsonValue;
  createdBy?: string;
  sourceType?: string;
  sourceId?: string;
}

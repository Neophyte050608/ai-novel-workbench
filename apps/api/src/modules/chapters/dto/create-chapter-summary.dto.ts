import type { Prisma } from '@prisma/client';

export class CreateChapterSummaryDto {
  chapterVersionId?: string;
  summary!: string;
  keyEvents?: Prisma.InputJsonValue;
  characterChanges?: Prisma.InputJsonValue;
  newFacts?: Prisma.InputJsonValue;
  createdBy?: string;
  sourceType?: string;
  sourceId?: string;
}

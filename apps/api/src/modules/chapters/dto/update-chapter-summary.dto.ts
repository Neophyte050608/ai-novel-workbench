import type { Prisma } from '@prisma/client';

export class UpdateChapterSummaryDto {
  chapterVersionId?: string | null;
  summary?: string;
  keyEvents?: Prisma.InputJsonValue;
  characterChanges?: Prisma.InputJsonValue;
  newFacts?: Prisma.InputJsonValue;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

import type { Prisma } from '@prisma/client';

export class UpdateCharacterStateDto {
  chapterId?: string | null;
  stage?: string;
  orderIndex?: number;
  location?: string | null;
  physicalState?: string | null;
  emotionalState?: string | null;
  goal?: string | null;
  knownSecrets?: Prisma.InputJsonValue;
  relationshipChanges?: Prisma.InputJsonValue;
  statusNote?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

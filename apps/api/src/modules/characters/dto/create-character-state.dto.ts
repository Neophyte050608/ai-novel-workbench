import type { Prisma } from '@prisma/client';

export class CreateCharacterStateDto {
  chapterId?: string;
  stage?: string;
  orderIndex?: number;
  location?: string;
  physicalState?: string;
  emotionalState?: string;
  goal?: string;
  knownSecrets?: Prisma.InputJsonValue;
  relationshipChanges?: Prisma.InputJsonValue;
  statusNote?: string;
  sourceType?: string;
  sourceId?: string;
}

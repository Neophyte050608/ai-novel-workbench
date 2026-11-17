import type { Prisma } from '@prisma/client';

export class CreateCharacterDto {
  name!: string;
  kind?: string;
  role?: string;
  lifeStatus?: string;
  personality?: string;
  motivation?: string;
  background?: string;
  appearance?: string;
  voiceStyle?: string;
  relationshipMap?: Prisma.InputJsonValue;
  arc?: string;
  importance?: number;
  currentState?: Prisma.InputJsonValue;
  sourceType?: string;
  sourceId?: string;
}

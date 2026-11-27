import type { Prisma } from '@prisma/client';

export class CreateAiDraftDto {
  targetType!: string;
  targetId?: string | null;
  draftType!: string;
  payload!: Prisma.InputJsonValue;
  textPreview?: string | null;
  sourceTaskId?: string | null;
  feedback?: string | null;
  previousDraftId?: string | null;
}

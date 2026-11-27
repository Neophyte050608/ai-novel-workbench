import type { Prisma } from '@prisma/client';

export class UpdateAiDraftDto {
  payload?: Prisma.InputJsonValue;
  textPreview?: string | null;
  feedback?: string | null;
}

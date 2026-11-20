import type { Prisma } from '@prisma/client';

export class UpdateScenePlanDto {
  chapterPlanId?: string | null;
  title?: string | null;
  goal?: string | null;
  outline?: string | null;
  conflict?: string | null;
  choice?: string | null;
  consequence?: string | null;
  readerPromise?: string | null;
  readerPayoff?: string | null;
  nextHook?: string | null;
  constraints?: Prisma.InputJsonValue;
  orderIndex?: number;
  sourceType?: string | null;
  sourceId?: string | null;
}

import type { Prisma } from '@prisma/client';

export class CreateScenePlanDto {
  chapterPlanId?: string;
  title?: string;
  goal?: string;
  outline?: string;
  conflict?: string;
  choice?: string;
  consequence?: string;
  readerPromise?: string;
  readerPayoff?: string;
  nextHook?: string;
  constraints?: Prisma.InputJsonValue;
  orderIndex?: number;
  sourceType?: string;
  sourceId?: string;
}

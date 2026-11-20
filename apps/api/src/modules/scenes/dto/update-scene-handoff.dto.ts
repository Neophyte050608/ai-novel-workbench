import type { Prisma } from '@prisma/client';

export class UpdateSceneHandoffDto {
  sceneVersionId?: string | null;
  nextSceneId?: string | null;
  readerKnows?: Prisma.InputJsonValue;
  actualChanges?: Prisma.InputJsonValue;
  openQuestions?: Prisma.InputJsonValue;
  promisesOpened?: Prisma.InputJsonValue;
  promisesClosed?: Prisma.InputJsonValue;
  nextSceneMust?: Prisma.InputJsonValue;
  riskNotes?: Prisma.InputJsonValue;
  createdBy?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

import type { Prisma } from '@prisma/client';

export class CreateSceneHandoffDto {
  sceneVersionId?: string;
  nextSceneId?: string;
  readerKnows?: Prisma.InputJsonValue;
  actualChanges?: Prisma.InputJsonValue;
  openQuestions?: Prisma.InputJsonValue;
  promisesOpened?: Prisma.InputJsonValue;
  promisesClosed?: Prisma.InputJsonValue;
  nextSceneMust?: Prisma.InputJsonValue;
  riskNotes?: Prisma.InputJsonValue;
  createdBy?: string;
  sourceType?: string;
  sourceId?: string;
}

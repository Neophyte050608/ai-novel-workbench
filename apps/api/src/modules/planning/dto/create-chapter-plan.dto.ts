export class CreateChapterPlanDto {
  volumeId?: string | null;
  chapterId?: string | null;
  title?: string;
  goal?: string;
  outline?: string;
  pov?: string;
  constraints?: unknown;
  orderIndex?: number;
  status?: string;
  sourceType?: string;
  sourceId?: string;
}

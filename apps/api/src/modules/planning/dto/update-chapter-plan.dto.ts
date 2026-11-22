export class UpdateChapterPlanDto {
  volumeId?: string | null;
  title?: string | null;
  goal?: string | null;
  outline?: string | null;
  pov?: string | null;
  constraints?: unknown;
  orderIndex?: number;
  status?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export class UpdateSceneVersionDto {
  source?: string;
  sourceType?: string | null;
  sourceId?: string | null;
  content?: string;
  wordCount?: number | null;
  changeSummary?: string | null;
  basedOnVersionId?: string | null;
}

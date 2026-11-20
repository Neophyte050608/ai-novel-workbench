export class CreateSceneVersionDto {
  source?: string;
  sourceType?: string;
  sourceId?: string;
  content!: string;
  wordCount?: number;
  changeSummary?: string;
  basedOnVersionId?: string;
}

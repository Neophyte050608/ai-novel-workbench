export class UpdateLocationStateDto {
  chapterId?: string | null;
  stage?: string;
  orderIndex?: number;
  lifecycleStatus?: string;
  dangerLevel?: string;
  accessRule?: string;
  visibility?: string;
  environmentChanges?: string;
  controlSummary?: string;
  eventSummary?: string;
  stateNote?: string;
  sourceType?: string;
  sourceId?: string;
}

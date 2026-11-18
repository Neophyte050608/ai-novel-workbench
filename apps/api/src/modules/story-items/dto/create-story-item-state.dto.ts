export class CreateStoryItemStateDto {
  chapterId?: string;
  stage?: string;
  orderIndex?: number;
  owner?: string;
  location?: string;
  lifecycleStatus?: string;
  visibility?: string;
  condition?: string;
  powerState?: string;
  eventSummary?: string;
  stateNote?: string;
  sourceType?: string;
  sourceId?: string;
}

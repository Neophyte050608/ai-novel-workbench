export class UpdateFactionStateDto {
  chapterId?: string | null;
  stage?: string;
  orderIndex?: number;
  status?: string;
  powerLevel?: string;
  influenceLevel?: string;
  resourceState?: string;
  internalState?: string;
  publicReputation?: string;
  goal?: string;
  conflictSummary?: string;
  eventSummary?: string;
  stateNote?: string;
  sourceType?: string;
  sourceId?: string;
}

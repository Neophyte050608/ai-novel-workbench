export class UpdateFactionRelationDto {
  targetFactionId?: string;
  relationType?: string;
  direction?: string;
  strength?: string;
  isCurrent?: boolean;
  startsAt?: string;
  endsAt?: string;
  description?: string;
  sourceType?: string;
  sourceId?: string;
}

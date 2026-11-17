export class CreateLocationFactionDto {
  factionId!: string;
  relationType?: string;
  influenceLevel?: string;
  isCurrent?: boolean;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  sourceType?: string;
  sourceId?: string;
}

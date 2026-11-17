export class CreateFactionMembershipDto {
  characterId!: string;
  membershipType?: string;
  roleTitle?: string;
  rank?: string;
  department?: string;
  isCurrent?: boolean;
  isPublic?: boolean;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
  sourceType?: string;
  sourceId?: string;
}

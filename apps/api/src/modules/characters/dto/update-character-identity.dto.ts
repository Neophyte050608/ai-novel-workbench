export class UpdateCharacterIdentityDto {
  title?: string;
  description?: string | null;
  type?: string | null;
  isPublic?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  importance?: number;
  sourceType?: string | null;
  sourceId?: string | null;
}

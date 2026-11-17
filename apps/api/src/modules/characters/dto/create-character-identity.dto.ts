export class CreateCharacterIdentityDto {
  title!: string;
  description?: string;
  type?: string;
  isPublic?: boolean;
  startsAt?: string;
  endsAt?: string;
  importance?: number;
  sourceType?: string;
  sourceId?: string;
}

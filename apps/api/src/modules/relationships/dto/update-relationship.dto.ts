import { CreateRelationshipDto } from './create-relationship.dto';

export class UpdateRelationshipDto implements Partial<CreateRelationshipDto> {
  sourceType?: string;
  sourceId?: string;
  targetType?: string;
  targetId?: string;
  relationType?: string;
  description?: string;
  strength?: number;
  importance?: number;
  direction?: string;
  isCurrent?: boolean;
  startsAt?: string;
  endsAt?: string;
  canonStatus?: string;
  evidenceType?: string;
  evidenceId?: string;
}

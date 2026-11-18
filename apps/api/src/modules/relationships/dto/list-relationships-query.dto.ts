export class ListRelationshipsQueryDto {
  sourceType?: string;
  sourceId?: string;
  targetType?: string;
  targetId?: string;
  entityType?: string;
  entityId?: string;
  relationType?: string;
  canonStatus?: string;
  isCurrent?: string | boolean;
  page?: string | number;
  pageSize?: string | number;
}

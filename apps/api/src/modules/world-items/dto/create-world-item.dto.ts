export class CreateWorldItemDto {
  name!: string;
  type?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  visibility?: string;
  importance?: number;
  sourceType?: string;
  sourceId?: string;
}

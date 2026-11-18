import { CreateWorldItemDto } from './create-world-item.dto';

export class UpdateWorldItemDto implements Partial<CreateWorldItemDto> {
  name?: string;
  type?: string;
  summary?: string;
  content?: string;
  tags?: string[];
  visibility?: string;
  importance?: number;
  sourceType?: string;
  sourceId?: string;
}

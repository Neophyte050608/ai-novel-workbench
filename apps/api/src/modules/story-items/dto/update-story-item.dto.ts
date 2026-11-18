import { CreateStoryItemDto } from './create-story-item.dto';

export class UpdateStoryItemDto implements Partial<CreateStoryItemDto> {
  parentId?: string;
  name?: string;
  aliases?: string[];
  itemType?: string;
  narrativeRole?: string;
  summary?: string;
  description?: string;
  origin?: string;
  appearance?: string;
  function?: string;
  effect?: string;
  cost?: string;
  limitation?: string;
  owner?: string;
  location?: string;
  lifecycleStatus?: string;
  visibility?: string;
  importance?: number;
  orderIndex?: number;
  sourceType?: string;
  sourceId?: string;
}

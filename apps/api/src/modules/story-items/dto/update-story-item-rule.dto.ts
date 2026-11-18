import { CreateStoryItemRuleDto } from './create-story-item-rule.dto';

export class UpdateStoryItemRuleDto implements Partial<CreateStoryItemRuleDto> {
  worldRuleId?: string;
  relationType?: string;
  isPrimary?: boolean;
  enforcementLevel?: string;
  notes?: string;
  orderIndex?: number;
}

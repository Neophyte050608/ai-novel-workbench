import { CreateAbilityDto } from './create-ability.dto';

export class UpdateAbilityDto implements Partial<CreateAbilityDto> {
  name?: string;
  aliases?: string[];
  abilityType?: string;
  narrativeRole?: string;
  summary?: string;
  description?: string;
  effect?: string;
  cost?: string;
  limitation?: string;
  condition?: string;
  source?: string;
  progression?: string;
  masteryNotes?: string;
  countermeasure?: string;
  visibility?: string;
  importance?: number;
  orderIndex?: number;
  sourceType?: string;
  sourceId?: string;
}

import { CreateAbilityRuleDto } from './create-ability-rule.dto';

export class UpdateAbilityRuleDto implements Partial<CreateAbilityRuleDto> {
  worldRuleId?: string;
  relationType?: string;
  isPrimary?: boolean;
  enforcementLevel?: string;
  notes?: string;
  orderIndex?: number;
}

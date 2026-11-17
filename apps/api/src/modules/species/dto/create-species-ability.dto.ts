export class CreateSpeciesAbilityDto {
  name!: string;
  aliases?: string[];
  abilityType?: string;
  summary?: string;
  description?: string;
  effect?: string;
  cost?: string;
  limitation?: string;
  condition?: string;
  inheritanceType?: string;
  awakeningCondition?: string;
  masteryNotes?: string;
  isCommon?: boolean;
  isInheritable?: boolean;
  isUnique?: boolean;
  visibility?: string;
  importance?: number;
  sourceType?: string;
  sourceId?: string;
}

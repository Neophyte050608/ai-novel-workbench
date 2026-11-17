export class CreateWorldRuleDto {
  title!: string;
  summary?: string;
  content?: string;
  ruleType?: string;
  category?: string;
  priority?: string;
  status?: string;
  condition?: string;
  effect?: string;
  cost?: string;
  exception?: string;
  violationConsequence?: string;
  isHardRule?: boolean;
  isRevealed?: boolean;
  visibility?: string;
  importance?: number;
  sourceType?: string;
  sourceId?: string;
}

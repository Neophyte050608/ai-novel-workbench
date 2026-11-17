export class CreateSpeciesRuleDto {
  worldRuleId!: string;
  relationType?: string;
  isPrimary?: boolean;
  enforcementLevel?: string;
  notes?: string;
  orderIndex?: number;
}

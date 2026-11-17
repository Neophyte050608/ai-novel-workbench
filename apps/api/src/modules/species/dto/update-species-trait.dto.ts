export class UpdateSpeciesTraitDto {
  traitType?: string;
  name?: string;
  summary?: string;
  description?: string;
  isInheritable?: boolean;
  isCommon?: boolean;
  importance?: number;
  sourceType?: string;
  sourceId?: string;
}

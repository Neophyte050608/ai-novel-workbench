export class UpdateSpeciesDto {
  parentId?: string | null;
  name?: string;
  aliases?: string[];
  speciesType?: string;
  narrativeRole?: string;
  summary?: string;
  description?: string;
  appearance?: string;
  lifespan?: string;
  reproduction?: string;
  socialStructure?: string;
  rarity?: string;
  status?: string;
  visibility?: string;
  importance?: number;
  orderIndex?: number;
  sourceType?: string;
  sourceId?: string;
}

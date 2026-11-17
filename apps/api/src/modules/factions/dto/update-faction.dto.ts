export class UpdateFactionDto {
  parentId?: string | null;
  name?: string;
  aliases?: string[];
  factionType?: string;
  narrativeRole?: string;
  summary?: string;
  description?: string;
  ideology?: string;
  goal?: string;
  structure?: string;
  resources?: string;
  status?: string;
  visibility?: string;
  importance?: number;
  orderIndex?: number;
  sourceType?: string;
  sourceId?: string;
}

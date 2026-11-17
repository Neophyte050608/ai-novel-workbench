export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ProjectCounts {
  chapters: number;
  characters: number;
  worldItems: number;
  generationTasks: number;
}

export interface Project {
  id: string;
  title: string;
  subtitle?: string | null;
  status: string;
  logline?: string | null;
  summary?: string | null;
  premise?: string | null;
  coreIdea?: string | null;
  mainPlot?: string | null;
  intro?: string | null;
  storySeed?: string | null;
  worldview?: string | null;
  eraBackground?: string | null;
  targetLength?: string | null;
  estimatedChapters?: number | null;
  wordsPerChapter?: number | null;
  language: string;
  writingStyle?: string | null;
  tone?: string | null;
  pov?: string | null;
  protagonist?: string | null;
  coverAssetId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  genres: Array<{ genre: TaxonomyItem; isPrimary: boolean }>;
  tags: Array<{ tag: TaxonomyItem }>;
  _count: ProjectCounts;
}

export interface CreateProjectInput {
  title: string;
  subtitle?: string;
  status?: string;
  genreIds?: string[];
  primaryGenreId?: string;
  tagIds?: string[];
  logline?: string;
  summary?: string;
  premise?: string;
  coreIdea?: string;
  mainPlot?: string;
  intro?: string;
  storySeed?: string;
  worldview?: string;
  eraBackground?: string;
  targetLength?: string;
  estimatedChapters?: number;
  wordsPerChapter?: number;
  language?: string;
  writingStyle?: string;
  tone?: string;
  pov?: string;
  protagonist?: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export interface EntityBase {
  id: string;
  projectId: string;
  importance: number;
  canonStatus: string;
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Character extends EntityBase {
  name: string;
  kind?: string | null;
  role?: string | null;
  lifeStatus?: string | null;
  personality?: string | null;
  motivation?: string | null;
  background?: string | null;
  appearance?: string | null;
  voiceStyle?: string | null;
  relationshipMap?: unknown;
  arc?: string | null;
  currentState?: unknown;
}

export type CharacterInput = Partial<Omit<Character, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & {
  name?: string;
};

export interface Location extends EntityBase {
  parentId?: string | null;
  name: string;
  aliases?: string[];
  locationType?: string | null;
  narrativeRole?: string | null;
  summary?: string | null;
  description?: string | null;
  environment?: string | null;
  atmosphere?: string | null;
  terrain?: string | null;
  climate?: string | null;
  accessRule?: string | null;
  dangerLevel?: string | null;
  lifecycleStatus?: string | null;
  visibility?: string | null;
  orderIndex?: number;
}

export interface Faction extends EntityBase {
  parentId?: string | null;
  name: string;
  aliases?: string[];
  factionType?: string | null;
  narrativeRole?: string | null;
  summary?: string | null;
  description?: string | null;
  ideology?: string | null;
  goal?: string | null;
  structure?: string | null;
  resources?: string | null;
  status?: string | null;
  visibility?: string | null;
  orderIndex?: number;
}

export interface Species extends EntityBase {
  parentId?: string | null;
  name: string;
  aliases?: string[];
  speciesType?: string | null;
  narrativeRole?: string | null;
  summary?: string | null;
  description?: string | null;
  appearance?: string | null;
  lifespan?: string | null;
  reproduction?: string | null;
  socialStructure?: string | null;
  rarity?: string | null;
  status?: string | null;
  visibility?: string | null;
  orderIndex?: number;
}

export interface WorldRule extends EntityBase {
  title: string;
  summary?: string | null;
  content?: string | null;
  ruleType?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  condition?: string | null;
  effect?: string | null;
  cost?: string | null;
  exception?: string | null;
  violationConsequence?: string | null;
  isHardRule?: boolean;
  isRevealed?: boolean;
  visibility?: string | null;
}

export type LocationInput = Partial<Omit<Location, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };
export type FactionInput = Partial<Omit<Faction, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };
export type SpeciesInput = Partial<Omit<Species, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };
export type WorldRuleInput = Partial<Omit<WorldRule, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { title?: string };

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface LocationProfile {
  location: Location;
  latestState?: Record<string, unknown> | null;
  rules?: Record<string, unknown>[];
  factions?: Record<string, unknown>[];
}

export interface FactionProfile {
  faction: Faction;
  latestState?: Record<string, unknown> | null;
  memberships?: Record<string, unknown>[];
  relations?: Record<string, unknown>[];
  rules?: Record<string, unknown>[];
  locations?: Record<string, unknown>[];
}

export interface SpeciesProfile {
  species: Species;
  traits?: Record<string, unknown>[];
  abilities?: Record<string, unknown>[];
  rules?: Record<string, unknown>[];
}

export interface WorldRuleProfile {
  worldRule?: WorldRule;
  rule?: WorldRule;
  locations?: Record<string, unknown>[];
  factions?: Record<string, unknown>[];
  species?: Record<string, unknown>[];
}

export interface EntityRecord {
  id: string;
  name: string;
  summary?: string | null;
  type?: string | null;
  status?: string | null;
  importance?: number;
  updatedAt?: string;
  fields: Record<string, unknown>;
}

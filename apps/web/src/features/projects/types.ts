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


export interface StoryItem extends EntityBase {
  parentId?: string | null;
  name: string;
  aliases?: string[];
  itemType?: string | null;
  narrativeRole?: string | null;
  summary?: string | null;
  description?: string | null;
  origin?: string | null;
  appearance?: string | null;
  function?: string | null;
  effect?: string | null;
  cost?: string | null;
  limitation?: string | null;
  owner?: string | null;
  location?: string | null;
  lifecycleStatus?: string | null;
  visibility?: string | null;
  orderIndex?: number;
}

export interface Ability extends EntityBase {
  name: string;
  aliases?: string[];
  abilityType?: string | null;
  narrativeRole?: string | null;
  summary?: string | null;
  description?: string | null;
  effect?: string | null;
  cost?: string | null;
  limitation?: string | null;
  condition?: string | null;
  source?: string | null;
  progression?: string | null;
  masteryNotes?: string | null;
  countermeasure?: string | null;
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
export type StoryItemInput = Partial<Omit<StoryItem, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };
export type AbilityInput = Partial<Omit<Ability, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };

export interface WorldItem extends EntityBase {
  type: string;
  name: string;
  summary?: string | null;
  content?: string | null;
  tags?: string[];
  visibility?: string | null;
}

export type WorldItemInput = Partial<Omit<WorldItem, 'id' | 'projectId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };

export interface Relationship extends EntityBase {
  sourceType: RelationshipEntityType;
  sourceId: string;
  targetType: RelationshipEntityType;
  targetId: string;
  relationType: string;
  description?: string | null;
  strength?: number | null;
  direction?: 'directed' | 'bidirectional' | string | null;
  isCurrent: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  evidenceType?: string | null;
  evidenceId?: string | null;
}

export type RelationshipEntityType = 'character' | 'location' | 'faction' | 'species' | 'story_item' | 'ability' | 'world_rule' | 'world_item' | 'chapter' | 'chapter_plan';

export interface RelationshipInput {
  sourceType: RelationshipEntityType;
  sourceId: string;
  targetType: RelationshipEntityType;
  targetId: string;
  relationType: string;
  description?: string;
  strength?: number;
  importance?: number;
  direction?: 'directed' | 'bidirectional';
  isCurrent?: boolean;
  startsAt?: string;
  endsAt?: string;
  canonStatus?: string;
  evidenceType?: string;
  evidenceId?: string;
}

export interface RelationshipListQuery {
  sourceType?: RelationshipEntityType;
  sourceId?: string;
  targetType?: RelationshipEntityType;
  targetId?: string;
  entityType?: RelationshipEntityType;
  entityId?: string;
  relationType?: string;
  canonStatus?: string;
  isCurrent?: boolean;
  page?: number;
  pageSize?: number;
}

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

export interface StoryItemProfile {
  storyItem: StoryItem;
  latestState?: Record<string, unknown> | null;
  rules?: Record<string, unknown>[];
}

export interface AbilityProfile {
  ability: Ability;
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

export interface SubResourceBase {
  id: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CharacterState extends SubResourceBase {
  characterId: string;
  chapterId?: string | null;
  stage?: string | null;
  orderIndex: number;
  location?: string | null;
  physicalState?: string | null;
  emotionalState?: string | null;
  goal?: string | null;
  knownSecrets?: unknown;
  relationshipChanges?: unknown;
  statusNote?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface CharacterIdentity extends SubResourceBase {
  characterId: string;
  title: string;
  description?: string | null;
  type?: string | null;
  isPublic: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  importance: number;
  canonStatus?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface LocationState extends SubResourceBase {
  locationId: string;
  chapterId?: string | null;
  stage?: string | null;
  orderIndex: number;
  lifecycleStatus?: string | null;
  dangerLevel?: string | null;
  accessRule?: string | null;
  visibility?: string | null;
  environmentChanges?: string | null;
  controlSummary?: string | null;
  eventSummary?: string | null;
  stateNote?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface LocationRule extends SubResourceBase {
  locationId: string;
  worldRuleId: string;
  relationType?: string | null;
  isPrimary: boolean;
  enforcementLevel?: string | null;
  notes?: string | null;
  orderIndex: number;
}

export interface LocationFaction extends SubResourceBase {
  locationId: string;
  factionId: string;
  relationType?: string | null;
  influenceLevel?: string | null;
  isCurrent: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  notes?: string | null;
  canonStatus?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface FactionState extends SubResourceBase {
  factionId: string;
  chapterId?: string | null;
  stage?: string | null;
  orderIndex: number;
  status?: string | null;
  powerLevel?: string | null;
  influenceLevel?: string | null;
  resourceState?: string | null;
  internalState?: string | null;
  publicReputation?: string | null;
  goal?: string | null;
  conflictSummary?: string | null;
  eventSummary?: string | null;
  stateNote?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface FactionMembership extends SubResourceBase {
  factionId: string;
  characterId: string;
  membershipType?: string | null;
  roleTitle?: string | null;
  rank?: string | null;
  department?: string | null;
  isCurrent: boolean;
  isPublic: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  notes?: string | null;
  canonStatus?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface FactionRelation extends SubResourceBase {
  sourceFactionId: string;
  targetFactionId: string;
  relationType?: string | null;
  direction?: string | null;
  strength?: string | null;
  isCurrent: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  description?: string | null;
  canonStatus?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface FactionRule extends SubResourceBase {
  factionId: string;
  worldRuleId: string;
  relationType?: string | null;
  isPrimary: boolean;
  enforcementLevel?: string | null;
  notes?: string | null;
  orderIndex: number;
}

export interface SpeciesTrait extends SubResourceBase {
  speciesId: string;
  traitType?: string | null;
  name: string;
  summary?: string | null;
  description?: string | null;
  isInheritable: boolean;
  isCommon: boolean;
  importance: number;
  canonStatus?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface SpeciesAbility extends SubResourceBase {
  speciesId: string;
  name: string;
  aliases?: string[];
  abilityType?: string | null;
  summary?: string | null;
  description?: string | null;
  effect?: string | null;
  cost?: string | null;
  limitation?: string | null;
  condition?: string | null;
  inheritanceType?: string | null;
  awakeningCondition?: string | null;
  masteryNotes?: string | null;
  isCommon: boolean;
  isInheritable: boolean;
  isUnique: boolean;
  visibility?: string | null;
  importance: number;
  canonStatus?: string;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface SpeciesRule extends SubResourceBase {
  speciesId: string;
  worldRuleId: string;
  relationType?: string | null;
  isPrimary: boolean;
  enforcementLevel?: string | null;
  notes?: string | null;
  orderIndex: number;
}

export interface StoryItemState extends SubResourceBase {
  storyItemId: string;
  chapterId?: string | null;
  stage?: string | null;
  orderIndex: number;
  owner?: string | null;
  location?: string | null;
  lifecycleStatus?: string | null;
  visibility?: string | null;
  condition?: string | null;
  powerState?: string | null;
  eventSummary?: string | null;
  stateNote?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface StoryItemRule extends SubResourceBase {
  storyItemId: string;
  worldRuleId: string;
  relationType?: string | null;
  isPrimary: boolean;
  enforcementLevel?: string | null;
  notes?: string | null;
  orderIndex: number;
}

export interface AbilityRule extends SubResourceBase {
  abilityId: string;
  worldRuleId: string;
  relationType?: string | null;
  isPrimary: boolean;
  enforcementLevel?: string | null;
  notes?: string | null;
  orderIndex: number;
}

export type CharacterStateInput = Partial<Omit<CharacterState, 'id' | 'projectId' | 'characterId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
export type CharacterIdentityInput = Partial<Omit<CharacterIdentity, 'id' | 'projectId' | 'characterId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { title?: string };
export type LocationStateInput = Partial<Omit<LocationState, 'id' | 'projectId' | 'locationId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
export type LocationRuleInput = Partial<Omit<LocationRule, 'id' | 'projectId' | 'locationId' | 'createdAt' | 'updatedAt'>> & { worldRuleId?: string };
export type LocationFactionInput = Partial<Omit<LocationFaction, 'id' | 'projectId' | 'locationId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { factionId?: string };
export type FactionStateInput = Partial<Omit<FactionState, 'id' | 'projectId' | 'factionId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
export type FactionMembershipInput = Partial<Omit<FactionMembership, 'id' | 'projectId' | 'factionId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { characterId?: string };
export type FactionRelationInput = Partial<Omit<FactionRelation, 'id' | 'projectId' | 'sourceFactionId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { targetFactionId?: string };
export type FactionRuleInput = Partial<Omit<FactionRule, 'id' | 'projectId' | 'factionId' | 'createdAt' | 'updatedAt'>> & { worldRuleId?: string };
export type SpeciesTraitInput = Partial<Omit<SpeciesTrait, 'id' | 'projectId' | 'speciesId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };
export type SpeciesAbilityInput = Partial<Omit<SpeciesAbility, 'id' | 'projectId' | 'speciesId' | 'canonStatus' | 'createdAt' | 'updatedAt' | 'deletedAt'>> & { name?: string };
export type SpeciesRuleInput = Partial<Omit<SpeciesRule, 'id' | 'projectId' | 'speciesId' | 'createdAt' | 'updatedAt'>> & { worldRuleId?: string };
export type StoryItemStateInput = Partial<Omit<StoryItemState, 'id' | 'projectId' | 'storyItemId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
export type StoryItemRuleInput = Partial<Omit<StoryItemRule, 'id' | 'projectId' | 'storyItemId' | 'createdAt' | 'updatedAt'>> & { worldRuleId?: string };
export type AbilityRuleInput = Partial<Omit<AbilityRule, 'id' | 'projectId' | 'abilityId' | 'createdAt' | 'updatedAt'>> & { worldRuleId?: string };

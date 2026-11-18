import { apiDelete, apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type {
  Ability,
  AbilityInput,
  AbilityProfile,
  AbilityRule,
  AbilityRuleInput,
  Character,
  CharacterIdentity,
  CharacterIdentityInput,
  CharacterInput,
  CharacterState,
  CharacterStateInput,
  CreateProjectInput,
  Faction,
  FactionInput,
  FactionMembership,
  FactionMembershipInput,
  FactionProfile,
  FactionRelation,
  FactionRelationInput,
  FactionRule,
  FactionRuleInput,
  FactionState,
  FactionStateInput,
  Location,
  LocationFaction,
  LocationFactionInput,
  LocationInput,
  LocationProfile,
  LocationRule,
  LocationRuleInput,
  LocationState,
  LocationStateInput,
  PaginatedResponse,
  Project,
  Relationship,
  RelationshipInput,
  RelationshipListQuery,
  Species,
  SpeciesAbility,
  SpeciesAbilityInput,
  SpeciesInput,
  SpeciesProfile,
  SpeciesRule,
  SpeciesRuleInput,
  SpeciesTrait,
  SpeciesTraitInput,
  StoryItem,
  StoryItemInput,
  StoryItemProfile,
  StoryItemRule,
  StoryItemRuleInput,
  StoryItemState,
  StoryItemStateInput,
  TaxonomyItem,
  UpdateProjectInput,
  WorldItem,
  WorldItemInput,
  WorldRule,
  WorldRuleInput,
  WorldRuleProfile,
} from './types';

export function listProjects() {
  return apiGet<Project[] | PaginatedResponse<Project>>('/projects');
}

export function createProject(input: CreateProjectInput) {
  return apiPost<Project>('/projects', input);
}

export function updateProject(id: string, input: UpdateProjectInput) {
  return apiPatch<Project>(`/projects/${id}`, input);
}

export function deleteProject(id: string) {
  return apiDelete<Project>(`/projects/${id}`);
}

export function listGenres() {
  return apiGet<TaxonomyItem[]>('/taxonomy/genres');
}

export function listTags() {
  return apiGet<TaxonomyItem[]>('/taxonomy/tags');
}

export function listCharacters(projectId: string) {
  return apiGet<Character[]>(`/projects/${projectId}/characters`);
}

export function createCharacter(projectId: string, input: CharacterInput) {
  return apiPost<Character>(`/projects/${projectId}/characters`, input);
}

export function updateCharacter(projectId: string, characterId: string, input: CharacterInput) {
  return apiPatch<Character>(`/projects/${projectId}/characters/${characterId}`, input);
}

export function deleteCharacter(projectId: string, characterId: string) {
  return apiDelete<Character>(`/projects/${projectId}/characters/${characterId}`);
}

export function getCharacterProfile(projectId: string, characterId: string) {
  return apiGet<unknown>(`/projects/${projectId}/characters/${characterId}/profile`);
}

export function listCharacterStates(projectId: string, characterId: string) {
  return apiGet<CharacterState[]>(`/projects/${projectId}/characters/${characterId}/states`);
}
export function createCharacterState(projectId: string, characterId: string, input: CharacterStateInput) {
  return apiPost<CharacterState>(`/projects/${projectId}/characters/${characterId}/states`, input);
}
export function updateCharacterState(projectId: string, characterId: string, stateId: string, input: CharacterStateInput) {
  return apiPatch<CharacterState>(`/projects/${projectId}/characters/${characterId}/states/${stateId}`, input);
}
export function deleteCharacterState(projectId: string, characterId: string, stateId: string) {
  return apiDelete<CharacterState>(`/projects/${projectId}/characters/${characterId}/states/${stateId}`);
}

export function listCharacterIdentities(projectId: string, characterId: string) {
  return apiGet<CharacterIdentity[]>(`/projects/${projectId}/characters/${characterId}/identities`);
}
export function createCharacterIdentity(projectId: string, characterId: string, input: CharacterIdentityInput) {
  return apiPost<CharacterIdentity>(`/projects/${projectId}/characters/${characterId}/identities`, input);
}
export function updateCharacterIdentity(projectId: string, characterId: string, identityId: string, input: CharacterIdentityInput) {
  return apiPatch<CharacterIdentity>(`/projects/${projectId}/characters/${characterId}/identities/${identityId}`, input);
}
export function deleteCharacterIdentity(projectId: string, characterId: string, identityId: string) {
  return apiDelete<CharacterIdentity>(`/projects/${projectId}/characters/${characterId}/identities/${identityId}`);
}

export function listLocations(projectId: string) {
  return apiGet<Location[]>(`/projects/${projectId}/locations`);
}

export function createLocation(projectId: string, input: LocationInput) {
  return apiPost<Location>(`/projects/${projectId}/locations`, input);
}

export function updateLocation(projectId: string, locationId: string, input: LocationInput) {
  return apiPatch<Location>(`/projects/${projectId}/locations/${locationId}`, input);
}

export function deleteLocation(projectId: string, locationId: string) {
  return apiDelete<Location>(`/projects/${projectId}/locations/${locationId}`);
}

export function confirmLocation(projectId: string, locationId: string) {
  return apiPost<Location>(`/projects/${projectId}/locations/${locationId}/confirm`, {});
}

export function archiveLocation(projectId: string, locationId: string) {
  return apiPost<Location>(`/projects/${projectId}/locations/${locationId}/archive`, {});
}

export function getLocationProfile(projectId: string, locationId: string) {
  return apiGet<LocationProfile>(`/projects/${projectId}/locations/${locationId}/profile`);
}

export function listLocationStates(projectId: string, locationId: string) {
  return apiGet<LocationState[]>(`/projects/${projectId}/locations/${locationId}/states`);
}
export function createLocationState(projectId: string, locationId: string, input: LocationStateInput) {
  return apiPost<LocationState>(`/projects/${projectId}/locations/${locationId}/states`, input);
}
export function updateLocationState(projectId: string, locationId: string, stateId: string, input: LocationStateInput) {
  return apiPatch<LocationState>(`/projects/${projectId}/locations/${locationId}/states/${stateId}`, input);
}
export function deleteLocationState(projectId: string, locationId: string, stateId: string) {
  return apiDelete<LocationState>(`/projects/${projectId}/locations/${locationId}/states/${stateId}`);
}

export function listLocationRules(projectId: string, locationId: string) {
  return apiGet<LocationRule[]>(`/projects/${projectId}/locations/${locationId}/rules`);
}
export function createLocationRule(projectId: string, locationId: string, input: LocationRuleInput) {
  return apiPost<LocationRule>(`/projects/${projectId}/locations/${locationId}/rules`, input);
}
export function updateLocationRule(projectId: string, locationId: string, locationRuleId: string, input: LocationRuleInput) {
  return apiPatch<LocationRule>(`/projects/${projectId}/locations/${locationId}/rules/${locationRuleId}`, input);
}
export function deleteLocationRule(projectId: string, locationId: string, locationRuleId: string) {
  return apiDelete<LocationRule>(`/projects/${projectId}/locations/${locationId}/rules/${locationRuleId}`);
}

export function listLocationFactions(projectId: string, locationId: string) {
  return apiGet<LocationFaction[]>(`/projects/${projectId}/locations/${locationId}/factions`);
}
export function createLocationFaction(projectId: string, locationId: string, input: LocationFactionInput) {
  return apiPost<LocationFaction>(`/projects/${projectId}/locations/${locationId}/factions`, input);
}
export function updateLocationFaction(projectId: string, locationId: string, locationFactionId: string, input: LocationFactionInput) {
  return apiPatch<LocationFaction>(`/projects/${projectId}/locations/${locationId}/factions/${locationFactionId}`, input);
}
export function deleteLocationFaction(projectId: string, locationId: string, locationFactionId: string) {
  return apiDelete<LocationFaction>(`/projects/${projectId}/locations/${locationId}/factions/${locationFactionId}`);
}

export function listFactions(projectId: string) {
  return apiGet<PaginatedResponse<Faction> | Faction[]>(`/projects/${projectId}/factions`);
}

export function createFaction(projectId: string, input: FactionInput) {
  return apiPost<Faction>(`/projects/${projectId}/factions`, input);
}

export function updateFaction(projectId: string, factionId: string, input: FactionInput) {
  return apiPatch<Faction>(`/projects/${projectId}/factions/${factionId}`, input);
}

export function deleteFaction(projectId: string, factionId: string) {
  return apiDelete<Faction>(`/projects/${projectId}/factions/${factionId}`);
}

export function confirmFaction(projectId: string, factionId: string) {
  return apiPost<Faction>(`/projects/${projectId}/factions/${factionId}/confirm`, {});
}

export function archiveFaction(projectId: string, factionId: string) {
  return apiPost<Faction>(`/projects/${projectId}/factions/${factionId}/archive`, {});
}

export function getFactionProfile(projectId: string, factionId: string) {
  return apiGet<FactionProfile>(`/projects/${projectId}/factions/${factionId}/profile`);
}

export function listFactionStates(projectId: string, factionId: string) {
  return apiGet<FactionState[]>(`/projects/${projectId}/factions/${factionId}/states`);
}
export function createFactionState(projectId: string, factionId: string, input: FactionStateInput) {
  return apiPost<FactionState>(`/projects/${projectId}/factions/${factionId}/states`, input);
}
export function updateFactionState(projectId: string, factionId: string, stateId: string, input: FactionStateInput) {
  return apiPatch<FactionState>(`/projects/${projectId}/factions/${factionId}/states/${stateId}`, input);
}
export function deleteFactionState(projectId: string, factionId: string, stateId: string) {
  return apiDelete<FactionState>(`/projects/${projectId}/factions/${factionId}/states/${stateId}`);
}

export function listFactionMemberships(projectId: string, factionId: string) {
  return apiGet<FactionMembership[]>(`/projects/${projectId}/factions/${factionId}/memberships`);
}
export function createFactionMembership(projectId: string, factionId: string, input: FactionMembershipInput) {
  return apiPost<FactionMembership>(`/projects/${projectId}/factions/${factionId}/memberships`, input);
}
export function updateFactionMembership(projectId: string, factionId: string, membershipId: string, input: FactionMembershipInput) {
  return apiPatch<FactionMembership>(`/projects/${projectId}/factions/${factionId}/memberships/${membershipId}`, input);
}
export function deleteFactionMembership(projectId: string, factionId: string, membershipId: string) {
  return apiDelete<FactionMembership>(`/projects/${projectId}/factions/${factionId}/memberships/${membershipId}`);
}

export function listFactionRelations(projectId: string, factionId: string) {
  return apiGet<FactionRelation[]>(`/projects/${projectId}/factions/${factionId}/relations`);
}
export function createFactionRelation(projectId: string, factionId: string, input: FactionRelationInput) {
  return apiPost<FactionRelation>(`/projects/${projectId}/factions/${factionId}/relations`, input);
}
export function updateFactionRelation(projectId: string, factionId: string, relationId: string, input: FactionRelationInput) {
  return apiPatch<FactionRelation>(`/projects/${projectId}/factions/${factionId}/relations/${relationId}`, input);
}
export function deleteFactionRelation(projectId: string, factionId: string, relationId: string) {
  return apiDelete<FactionRelation>(`/projects/${projectId}/factions/${factionId}/relations/${relationId}`);
}

export function listFactionRules(projectId: string, factionId: string) {
  return apiGet<FactionRule[]>(`/projects/${projectId}/factions/${factionId}/rules`);
}
export function createFactionRule(projectId: string, factionId: string, input: FactionRuleInput) {
  return apiPost<FactionRule>(`/projects/${projectId}/factions/${factionId}/rules`, input);
}
export function updateFactionRule(projectId: string, factionId: string, factionRuleId: string, input: FactionRuleInput) {
  return apiPatch<FactionRule>(`/projects/${projectId}/factions/${factionId}/rules/${factionRuleId}`, input);
}
export function deleteFactionRule(projectId: string, factionId: string, factionRuleId: string) {
  return apiDelete<FactionRule>(`/projects/${projectId}/factions/${factionId}/rules/${factionRuleId}`);
}

export function listSpecies(projectId: string) {
  return apiGet<Species[]>(`/projects/${projectId}/species`);
}

export function createSpecies(projectId: string, input: SpeciesInput) {
  return apiPost<Species>(`/projects/${projectId}/species`, input);
}

export function updateSpecies(projectId: string, speciesId: string, input: SpeciesInput) {
  return apiPatch<Species>(`/projects/${projectId}/species/${speciesId}`, input);
}

export function deleteSpecies(projectId: string, speciesId: string) {
  return apiDelete<Species>(`/projects/${projectId}/species/${speciesId}`);
}

export function confirmSpecies(projectId: string, speciesId: string) {
  return apiPost<Species>(`/projects/${projectId}/species/${speciesId}/confirm`, {});
}

export function archiveSpecies(projectId: string, speciesId: string) {
  return apiPost<Species>(`/projects/${projectId}/species/${speciesId}/archive`, {});
}

export function getSpeciesProfile(projectId: string, speciesId: string) {
  return apiGet<SpeciesProfile>(`/projects/${projectId}/species/${speciesId}/profile`);
}

export function listSpeciesTraits(projectId: string, speciesId: string) {
  return apiGet<SpeciesTrait[]>(`/projects/${projectId}/species/${speciesId}/traits`);
}
export function createSpeciesTrait(projectId: string, speciesId: string, input: SpeciesTraitInput) {
  return apiPost<SpeciesTrait>(`/projects/${projectId}/species/${speciesId}/traits`, input);
}
export function updateSpeciesTrait(projectId: string, speciesId: string, traitId: string, input: SpeciesTraitInput) {
  return apiPatch<SpeciesTrait>(`/projects/${projectId}/species/${speciesId}/traits/${traitId}`, input);
}
export function deleteSpeciesTrait(projectId: string, speciesId: string, traitId: string) {
  return apiDelete<SpeciesTrait>(`/projects/${projectId}/species/${speciesId}/traits/${traitId}`);
}

export function listSpeciesAbilities(projectId: string, speciesId: string) {
  return apiGet<SpeciesAbility[]>(`/projects/${projectId}/species/${speciesId}/abilities`);
}
export function createSpeciesAbility(projectId: string, speciesId: string, input: SpeciesAbilityInput) {
  return apiPost<SpeciesAbility>(`/projects/${projectId}/species/${speciesId}/abilities`, input);
}
export function updateSpeciesAbility(projectId: string, speciesId: string, abilityId: string, input: SpeciesAbilityInput) {
  return apiPatch<SpeciesAbility>(`/projects/${projectId}/species/${speciesId}/abilities/${abilityId}`, input);
}
export function deleteSpeciesAbility(projectId: string, speciesId: string, abilityId: string) {
  return apiDelete<SpeciesAbility>(`/projects/${projectId}/species/${speciesId}/abilities/${abilityId}`);
}

export function listSpeciesRules(projectId: string, speciesId: string) {
  return apiGet<SpeciesRule[]>(`/projects/${projectId}/species/${speciesId}/rules`);
}
export function createSpeciesRule(projectId: string, speciesId: string, input: SpeciesRuleInput) {
  return apiPost<SpeciesRule>(`/projects/${projectId}/species/${speciesId}/rules`, input);
}
export function updateSpeciesRule(projectId: string, speciesId: string, speciesRuleId: string, input: SpeciesRuleInput) {
  return apiPatch<SpeciesRule>(`/projects/${projectId}/species/${speciesId}/rules/${speciesRuleId}`, input);
}
export function deleteSpeciesRule(projectId: string, speciesId: string, speciesRuleId: string) {
  return apiDelete<SpeciesRule>(`/projects/${projectId}/species/${speciesId}/rules/${speciesRuleId}`);
}


export function listStoryItems(projectId: string) {
  return apiGet<StoryItem[]>(`/projects/${projectId}/story-items`);
}

export function createStoryItem(projectId: string, input: StoryItemInput) {
  return apiPost<StoryItem>(`/projects/${projectId}/story-items`, input);
}

export function updateStoryItem(projectId: string, storyItemId: string, input: StoryItemInput) {
  return apiPatch<StoryItem>(`/projects/${projectId}/story-items/${storyItemId}`, input);
}

export function deleteStoryItem(projectId: string, storyItemId: string) {
  return apiDelete<StoryItem>(`/projects/${projectId}/story-items/${storyItemId}`);
}

export function confirmStoryItem(projectId: string, storyItemId: string) {
  return apiPost<StoryItem>(`/projects/${projectId}/story-items/${storyItemId}/confirm`, {});
}

export function archiveStoryItem(projectId: string, storyItemId: string) {
  return apiPost<StoryItem>(`/projects/${projectId}/story-items/${storyItemId}/archive`, {});
}

export function getStoryItemProfile(projectId: string, storyItemId: string) {
  return apiGet<StoryItemProfile>(`/projects/${projectId}/story-items/${storyItemId}/profile`);
}

export function listStoryItemStates(projectId: string, storyItemId: string) {
  return apiGet<StoryItemState[]>(`/projects/${projectId}/story-items/${storyItemId}/states`);
}
export function createStoryItemState(projectId: string, storyItemId: string, input: StoryItemStateInput) {
  return apiPost<StoryItemState>(`/projects/${projectId}/story-items/${storyItemId}/states`, input);
}
export function updateStoryItemState(projectId: string, storyItemId: string, stateId: string, input: StoryItemStateInput) {
  return apiPatch<StoryItemState>(`/projects/${projectId}/story-items/${storyItemId}/states/${stateId}`, input);
}
export function deleteStoryItemState(projectId: string, storyItemId: string, stateId: string) {
  return apiDelete<StoryItemState>(`/projects/${projectId}/story-items/${storyItemId}/states/${stateId}`);
}

export function listStoryItemRules(projectId: string, storyItemId: string) {
  return apiGet<StoryItemRule[]>(`/projects/${projectId}/story-items/${storyItemId}/rules`);
}
export function createStoryItemRule(projectId: string, storyItemId: string, input: StoryItemRuleInput) {
  return apiPost<StoryItemRule>(`/projects/${projectId}/story-items/${storyItemId}/rules`, input);
}
export function updateStoryItemRule(projectId: string, storyItemId: string, storyItemRuleId: string, input: StoryItemRuleInput) {
  return apiPatch<StoryItemRule>(`/projects/${projectId}/story-items/${storyItemId}/rules/${storyItemRuleId}`, input);
}
export function deleteStoryItemRule(projectId: string, storyItemId: string, storyItemRuleId: string) {
  return apiDelete<StoryItemRule>(`/projects/${projectId}/story-items/${storyItemId}/rules/${storyItemRuleId}`);
}

export function listAbilities(projectId: string) {
  return apiGet<Ability[]>(`/projects/${projectId}/abilities`);
}

export function createAbility(projectId: string, input: AbilityInput) {
  return apiPost<Ability>(`/projects/${projectId}/abilities`, input);
}

export function updateAbility(projectId: string, abilityId: string, input: AbilityInput) {
  return apiPatch<Ability>(`/projects/${projectId}/abilities/${abilityId}`, input);
}

export function deleteAbility(projectId: string, abilityId: string) {
  return apiDelete<Ability>(`/projects/${projectId}/abilities/${abilityId}`);
}

export function confirmAbility(projectId: string, abilityId: string) {
  return apiPost<Ability>(`/projects/${projectId}/abilities/${abilityId}/confirm`, {});
}

export function archiveAbility(projectId: string, abilityId: string) {
  return apiPost<Ability>(`/projects/${projectId}/abilities/${abilityId}/archive`, {});
}

export function getAbilityProfile(projectId: string, abilityId: string) {
  return apiGet<AbilityProfile>(`/projects/${projectId}/abilities/${abilityId}/profile`);
}

export function listAbilityRules(projectId: string, abilityId: string) {
  return apiGet<AbilityRule[]>(`/projects/${projectId}/abilities/${abilityId}/rules`);
}
export function createAbilityRule(projectId: string, abilityId: string, input: AbilityRuleInput) {
  return apiPost<AbilityRule>(`/projects/${projectId}/abilities/${abilityId}/rules`, input);
}
export function updateAbilityRule(projectId: string, abilityId: string, abilityRuleId: string, input: AbilityRuleInput) {
  return apiPatch<AbilityRule>(`/projects/${projectId}/abilities/${abilityId}/rules/${abilityRuleId}`, input);
}
export function deleteAbilityRule(projectId: string, abilityId: string, abilityRuleId: string) {
  return apiDelete<AbilityRule>(`/projects/${projectId}/abilities/${abilityId}/rules/${abilityRuleId}`);
}

export function listRelationships(projectId: string, query: RelationshipListQuery = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiGet<PaginatedResponse<Relationship>>(`/projects/${projectId}/relationships${suffix}`);
}

export function createRelationship(projectId: string, input: RelationshipInput) {
  return apiPost<Relationship>(`/projects/${projectId}/relationships`, input);
}

export function getRelationship(projectId: string, relationshipId: string) {
  return apiGet<Relationship>(`/projects/${projectId}/relationships/${relationshipId}`);
}

export function updateRelationship(projectId: string, relationshipId: string, input: Partial<RelationshipInput>) {
  return apiPatch<Relationship>(`/projects/${projectId}/relationships/${relationshipId}`, input);
}

export function deleteRelationship(projectId: string, relationshipId: string) {
  return apiDelete<Relationship>(`/projects/${projectId}/relationships/${relationshipId}`);
}

export function confirmRelationship(projectId: string, relationshipId: string) {
  return apiPost<Relationship>(`/projects/${projectId}/relationships/${relationshipId}/confirm`, {});
}

export function archiveRelationship(projectId: string, relationshipId: string) {
  return apiPost<Relationship>(`/projects/${projectId}/relationships/${relationshipId}/archive`, {});
}

export function listWorldItems(projectId: string) {
  return apiGet<WorldItem[]>(`/projects/${projectId}/world-items`);
}

export function createWorldItem(projectId: string, input: WorldItemInput) {
  return apiPost<WorldItem>(`/projects/${projectId}/world-items`, input);
}

export function updateWorldItem(projectId: string, worldItemId: string, input: WorldItemInput) {
  return apiPatch<WorldItem>(`/projects/${projectId}/world-items/${worldItemId}`, input);
}

export function deleteWorldItem(projectId: string, worldItemId: string) {
  return apiDelete<WorldItem>(`/projects/${projectId}/world-items/${worldItemId}`);
}

export function confirmWorldItem(projectId: string, worldItemId: string) {
  return apiPost<WorldItem>(`/projects/${projectId}/world-items/${worldItemId}/confirm`, {});
}

export function archiveWorldItem(projectId: string, worldItemId: string) {
  return apiPost<WorldItem>(`/projects/${projectId}/world-items/${worldItemId}/archive`, {});
}

export function listWorldRules(projectId: string) {
  return apiGet<WorldRule[]>(`/projects/${projectId}/world-rules`);
}

export function createWorldRule(projectId: string, input: WorldRuleInput) {
  return apiPost<WorldRule>(`/projects/${projectId}/world-rules`, input);
}

export function updateWorldRule(projectId: string, worldRuleId: string, input: WorldRuleInput) {
  return apiPatch<WorldRule>(`/projects/${projectId}/world-rules/${worldRuleId}`, input);
}

export function deleteWorldRule(projectId: string, worldRuleId: string) {
  return apiDelete<WorldRule>(`/projects/${projectId}/world-rules/${worldRuleId}`);
}

export function confirmWorldRule(projectId: string, worldRuleId: string) {
  return apiPost<WorldRule>(`/projects/${projectId}/world-rules/${worldRuleId}/confirm`, {});
}

export function archiveWorldRule(projectId: string, worldRuleId: string) {
  return apiPost<WorldRule>(`/projects/${projectId}/world-rules/${worldRuleId}/archive`, {});
}

export function getWorldRuleProfile(projectId: string, worldRuleId: string) {
  return apiGet<WorldRuleProfile | WorldRule>(`/projects/${projectId}/world-rules/${worldRuleId}/profile`);
}

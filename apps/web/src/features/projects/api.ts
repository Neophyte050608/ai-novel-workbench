import { apiDelete, apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type {
  Character,
  CharacterInput,
  CreateProjectInput,
  Faction,
  FactionInput,
  FactionProfile,
  Location,
  LocationInput,
  LocationProfile,
  PaginatedResponse,
  Project,
  Species,
  SpeciesInput,
  SpeciesProfile,
  TaxonomyItem,
  UpdateProjectInput,
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

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Notification,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconArrowLeft, IconDelete, IconEdit, IconFile, IconPlus, IconSearch } from '@douyinfe/semi-icons';
import { t } from '../../shared/i18n';
import {
  createCharacter,
  createFaction,
  createLocation,
  createProject,
  createSpecies,
  createWorldRule,
  deleteCharacter,
  deleteFaction,
  deleteLocation,
  deleteProject,
  deleteSpecies,
  deleteWorldRule,
  getFactionProfile,
  getLocationProfile,
  getSpeciesProfile,
  getWorldRuleProfile,
  listCharacters,
  listFactions,
  listGenres,
  listLocations,
  listProjects,
  listSpecies,
  listTags,
  listWorldRules,
  updateCharacter,
  updateFaction,
  updateLocation,
  updateProject,
  updateSpecies,
  updateWorldRule,
} from './api';
import type {
  Character,
  CharacterInput,
  CreateProjectInput,
  EntityRecord,
  Faction,
  FactionInput,
  FactionProfile,
  Location,
  LocationInput,
  LocationProfile,
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

const { Title, Text, Paragraph } = Typography;
type ViewMode = 'shelf' | 'manual-create' | 'workspace';
type WorkspaceSection = 'info' | 'characters' | 'locations' | 'factions' | 'species' | 'rules';
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type ModuleKind = Exclude<WorkspaceSection, 'info'>;
type DetailField = { key: string; label: string; long?: boolean };
type DetailGroup = { title: string; fields: DetailField[] };
type ModuleConfig = {
  kind: ModuleKind;
  title: string;
  description: string;
  addLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  metaFallback: string;
  groups: DetailGroup[];
};
type FilterState = { type?: string; status?: string; importance?: string };

const workspaceSections: WorkspaceSection[] = ['info', 'characters', 'locations', 'factions', 'species', 'rules'];

const projectLongFields = new Set(['logline', 'summary', 'premise', 'coreIdea', 'mainPlot', 'intro', 'storySeed', 'worldview', 'eraBackground', 'writingStyle']);
const projectInfoGroups: DetailGroup[] = [
  {
    title: t('projects.detail.basicInfo'),
    fields: [
      { key: 'title', label: t('projects.creation.titleLabel') },
      { key: 'subtitle', label: t('projects.workspace.info.subtitle') },
      { key: 'status', label: t('projects.workspace.info.status') },
      { key: 'logline', label: t('projects.workspace.info.logline'), long: true },
      { key: 'summary', label: t('projects.workspace.info.summary'), long: true },
    ],
  },
  {
    title: t('projects.workspace.info.creative'),
    fields: [
      { key: 'premise', label: t('projects.workspace.info.premise'), long: true },
      { key: 'coreIdea', label: t('projects.workspace.info.coreIdea'), long: true },
      { key: 'mainPlot', label: t('projects.workspace.info.mainPlot'), long: true },
      { key: 'intro', label: t('projects.workspace.info.intro'), long: true },
      { key: 'storySeed', label: t('projects.workspace.info.storySeed'), long: true },
      { key: 'worldview', label: t('projects.workspace.info.worldview'), long: true },
      { key: 'eraBackground', label: t('projects.workspace.info.eraBackground'), long: true },
    ],
  },
  {
    title: t('projects.workspace.info.styleAndLength'),
    fields: [
      { key: 'targetLength', label: t('projects.workspace.info.targetLength') },
      { key: 'estimatedChapters', label: t('projects.workspace.info.estimatedChapters') },
      { key: 'wordsPerChapter', label: t('projects.workspace.info.wordsPerChapter') },
      { key: 'language', label: t('projects.workspace.info.language') },
      { key: 'writingStyle', label: t('projects.detail.writingStyle'), long: true },
      { key: 'tone', label: t('projects.workspace.info.tone') },
      { key: 'pov', label: t('projects.workspace.info.pov') },
      { key: 'protagonist', label: t('projects.workspace.info.protagonist') },
    ],
  },
];

const moduleConfigs: Record<ModuleKind, ModuleConfig> = {
  characters: {
    kind: 'characters',
    title: t('modules.characters.title'),
    description: t('modules.characters.description'),
    addLabel: t('modules.characters.add'),
    nameLabel: t('modules.characters.nameLabel'),
    namePlaceholder: t('modules.characters.namePlaceholder'),
    metaFallback: t('modules.characters.listMetaFallback'),
    groups: [
      { title: t('modules.sections.characterBasic'), fields: fields(['name', 'kind', 'role', 'importance']) },
      { title: t('modules.sections.characterSetting'), fields: fields(['personality', 'motivation', 'background', 'appearance', 'voiceStyle', 'arc'], true) },
      { title: t('modules.sections.characterStatus'), fields: fields(['lifeStatus', 'currentState']) },
      { title: t('modules.sections.characterRelations'), fields: fields(['relationshipMap'], true) },
    ],
  },
  locations: {
    kind: 'locations',
    title: t('modules.locations.title'),
    description: t('modules.locations.description'),
    addLabel: t('modules.locations.add'),
    nameLabel: t('modules.locations.nameLabel'),
    namePlaceholder: t('modules.locations.namePlaceholder'),
    metaFallback: t('modules.locations.listMetaFallback'),
    groups: [
      { title: t('modules.sections.locationBasic'), fields: fields(['name', 'locationType', 'narrativeRole', 'summary', 'importance']) },
      { title: t('modules.sections.locationEnvironment'), fields: fields(['description', 'environment', 'atmosphere', 'terrain', 'climate'], true) },
      { title: t('modules.sections.locationRules'), fields: fields(['accessRule', 'dangerLevel', 'lifecycleStatus', 'visibility', 'relatedFactions', 'relatedRules']) },
      { title: t('modules.sections.locationRelations'), fields: fields(['relatedLocations', 'relatedCharacters', 'notes'], true) },
    ],
  },
  factions: {
    kind: 'factions',
    title: t('modules.factions.title'),
    description: t('modules.factions.description'),
    addLabel: t('modules.factions.add'),
    nameLabel: t('modules.factions.nameLabel'),
    namePlaceholder: t('modules.factions.namePlaceholder'),
    metaFallback: t('modules.factions.listMetaFallback'),
    groups: [
      { title: t('modules.sections.factionBasic'), fields: fields(['name', 'factionType', 'narrativeRole', 'summary', 'status', 'importance']) },
      { title: t('modules.sections.factionSetting'), fields: fields(['description', 'ideology', 'goal', 'structure', 'resources', 'visibility'], true) },
      { title: t('modules.sections.factionMembers'), fields: fields(['members', 'locations']) },
      { title: t('modules.sections.factionRelations'), fields: fields(['relatedFactions', 'relatedRules', 'notes'], true) },
    ],
  },
  species: {
    kind: 'species',
    title: t('modules.species.title'),
    description: t('modules.species.description'),
    addLabel: t('modules.species.add'),
    nameLabel: t('modules.species.nameLabel'),
    namePlaceholder: t('modules.species.namePlaceholder'),
    metaFallback: t('modules.species.listMetaFallback'),
    groups: [
      { title: t('modules.sections.speciesBasic'), fields: fields(['name', 'speciesType', 'narrativeRole', 'summary', 'rarity', 'status', 'importance']) },
      { title: t('modules.sections.speciesAbilities'), fields: fields(['description', 'appearance', 'lifespan', 'reproduction', 'socialStructure', 'traits', 'abilities'], true) },
      { title: t('modules.sections.speciesRules'), fields: fields(['visibility', 'relatedRules', 'notes'], true) },
      { title: t('modules.sections.speciesRelations'), fields: fields(['relatedSpecies', 'relatedFactions', 'relatedLocations'], true) },
    ],
  },
  rules: {
    kind: 'rules',
    title: t('modules.rules.title'),
    description: t('modules.rules.description'),
    addLabel: t('modules.rules.add'),
    nameLabel: t('modules.rules.nameLabel'),
    namePlaceholder: t('modules.rules.namePlaceholder'),
    metaFallback: t('modules.rules.listMetaFallback'),
    groups: [
      { title: t('modules.sections.ruleBasic'), fields: fields(['title', 'ruleType', 'category', 'priority', 'status', 'summary', 'importance']) },
      { title: t('modules.sections.ruleMechanism'), fields: fields(['condition', 'effect', 'cost', 'exception', 'violationConsequence'], true) },
      { title: t('modules.sections.ruleUsage'), fields: fields(['visibility', 'content'], true) },
      { title: t('modules.sections.ruleRelations'), fields: fields(['relatedLocations', 'relatedFactions', 'relatedSpecies', 'notes'], true) },
    ],
  },
};

function fields(keys: string[], long = false): DetailField[] {
  return keys.map((key) => ({ key, label: t(`modules.fields.${key}` as Parameters<typeof t>[0]), long }));
}

function record(id: string, name: string, summary: string, type: string, status: string, importance: number, values: Record<string, string | number | null | undefined>): EntityRecord {
  return { id, name, summary, type, status, importance, updatedAt: new Date().toISOString(), fields: { name, title: name, summary, importance, ...values } };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(new Date(value));
}

function primaryGenre(project: Project) {
  return project.genres.find((item) => item.isPrimary)?.genre ?? project.genres[0]?.genre;
}

function normalizeInput(values: CreateProjectInput & { idea?: string }): CreateProjectInput {
  const idea = values.idea?.trim();
  return {
    title: values.title?.trim(),
    genreIds: values.genreIds,
    primaryGenreId: values.genreIds?.[0],
    tagIds: values.tagIds,
    summary: values.summary?.trim() || idea || undefined,
    writingStyle: values.writingStyle?.trim() || undefined,
    status: 'planning',
  };
}

function compactText(value: unknown) {
  if (value === null || value === undefined || value === '') return t('common.notFilled');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function isEmptyDisplayValue(value: unknown) {
  return value === null || value === undefined || value === '';
}

function displayText(value: unknown) {
  return isEmptyDisplayValue(value) ? t('common.notFilled') : compactText(value);
}

function relationItems(value: unknown) {
  if (isEmptyDisplayValue(value)) return [];
  if (Array.isArray(value)) return value.map(compactText).filter(Boolean);
  if (isRecordValue(value)) return Object.values(value).map(compactText).filter(Boolean);
  return String(value)
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isRelationField(fieldKey: string) {
  return fieldKey === 'relationshipMap' || fieldKey === 'members' || fieldKey === 'locations' || fieldKey === 'traits' || fieldKey === 'abilities' || fieldKey.startsWith('related');
}

function isEmptyFilter(filter: FilterState) {
  return !filter.type && !filter.status && !filter.importance;
}

function formValue(value: unknown) {
  return value === null || value === undefined ? undefined : value;
}

function characterToRecord(character: Character): EntityRecord {
  return {
    id: character.id,
    name: character.name,
    summary: character.background || character.personality || character.role,
    type: character.kind,
    status: character.lifeStatus || character.canonStatus,
    importance: character.importance,
    updatedAt: character.updatedAt,
    fields: {
      name: character.name,
      kind: character.kind,
      role: character.role,
      lifeStatus: character.lifeStatus,
      personality: character.personality,
      motivation: character.motivation,
      background: character.background,
      appearance: character.appearance,
      voiceStyle: character.voiceStyle,
      relationshipMap: compactText(character.relationshipMap),
      arc: character.arc,
      importance: character.importance,
      currentState: compactText(character.currentState),
    },
  };
}

function locationToRecord(location: Location, profile?: LocationProfile): EntityRecord {
  const latestState = profile?.latestState;
  return {
    id: location.id,
    name: location.name,
    summary: location.summary || location.description || location.narrativeRole,
    type: location.locationType,
    status: location.lifecycleStatus || location.canonStatus,
    importance: location.importance,
    updatedAt: location.updatedAt,
    fields: {
      name: location.name,
      locationType: location.locationType,
      narrativeRole: location.narrativeRole,
      summary: location.summary,
      description: location.description,
      environment: latestState?.environmentChanges ?? location.environment,
      atmosphere: location.atmosphere,
      terrain: location.terrain,
      climate: location.climate,
      accessRule: latestState?.accessRule ?? location.accessRule,
      dangerLevel: latestState?.dangerLevel ?? location.dangerLevel,
      lifecycleStatus: latestState?.lifecycleStatus ?? location.lifecycleStatus,
      visibility: latestState?.visibility ?? location.visibility,
      relatedFactions: compactRelationList(profile?.factions),
      relatedRules: compactRelationList(profile?.rules),
      relatedLocations: undefined,
      relatedCharacters: undefined,
      notes: latestState?.stateNote,
      importance: location.importance,
    },
  };
}

function factionToRecord(faction: Faction, profile?: FactionProfile): EntityRecord {
  const latestState = profile?.latestState;
  return {
    id: faction.id,
    name: faction.name,
    summary: faction.summary || faction.description || faction.goal,
    type: faction.factionType,
    status: String(latestState?.status ?? faction.status ?? faction.canonStatus),
    importance: faction.importance,
    updatedAt: faction.updatedAt,
    fields: {
      name: faction.name,
      factionType: faction.factionType,
      narrativeRole: faction.narrativeRole,
      summary: faction.summary,
      status: latestState?.status ?? faction.status,
      description: faction.description,
      ideology: faction.ideology,
      goal: latestState?.goal ?? faction.goal,
      structure: faction.structure,
      resources: latestState?.resourceState ?? faction.resources,
      visibility: faction.visibility,
      members: compactRelationList(profile?.memberships),
      locations: compactRelationList(profile?.locations),
      relatedFactions: compactRelationList(profile?.relations),
      relatedRules: compactRelationList(profile?.rules),
      notes: latestState?.stateNote,
      importance: faction.importance,
    },
  };
}

function speciesToRecord(species: Species, profile?: SpeciesProfile): EntityRecord {
  return {
    id: species.id,
    name: species.name,
    summary: species.summary || species.description || species.narrativeRole,
    type: species.speciesType,
    status: species.status || species.rarity || species.canonStatus,
    importance: species.importance,
    updatedAt: species.updatedAt,
    fields: {
      name: species.name,
      speciesType: species.speciesType,
      narrativeRole: species.narrativeRole,
      summary: species.summary,
      rarity: species.rarity,
      status: species.status,
      description: species.description,
      appearance: species.appearance,
      lifespan: species.lifespan,
      reproduction: species.reproduction,
      socialStructure: species.socialStructure,
      traits: compactRelationList(profile?.traits),
      abilities: compactRelationList(profile?.abilities),
      visibility: species.visibility,
      relatedRules: compactRelationList(profile?.rules),
      notes: undefined,
      relatedSpecies: undefined,
      relatedFactions: undefined,
      relatedLocations: undefined,
      importance: species.importance,
    },
  };
}

function worldRuleToRecord(rule: WorldRule, profile?: WorldRuleProfile): EntityRecord {
  const profileRule = profile?.worldRule ?? profile?.rule ?? rule;
  return {
    id: profileRule.id,
    name: profileRule.title,
    summary: profileRule.summary || profileRule.content || profileRule.ruleType,
    type: profileRule.ruleType,
    status: profileRule.status || profileRule.canonStatus,
    importance: profileRule.importance,
    updatedAt: profileRule.updatedAt,
    fields: {
      title: profileRule.title,
      ruleType: profileRule.ruleType,
      category: profileRule.category,
      priority: profileRule.priority,
      status: profileRule.status,
      summary: profileRule.summary,
      importance: profileRule.importance,
      condition: profileRule.condition,
      effect: profileRule.effect,
      cost: profileRule.cost,
      exception: profileRule.exception,
      violationConsequence: profileRule.violationConsequence,
      visibility: profileRule.visibility,
      content: profileRule.content,
      relatedLocations: compactRelationList(profile?.locations),
      relatedFactions: compactRelationList(profile?.factions),
      relatedSpecies: compactRelationList(profile?.species),
      notes: undefined,
    },
  };
}

function isRecordValue(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function itemsFromResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!isRecordValue(response)) return [];

  const items = response.items;
  if (Array.isArray(items)) return items as T[];

  const data = response.data;
  if (Array.isArray(data)) return data as T[];
  if (isRecordValue(data) && Array.isArray(data.items)) return data.items as T[];

  return [];
}

function projectArray(response: Awaited<ReturnType<typeof listProjects>>): Project[] {
  return itemsFromResponse<Project>(response);
}

function compactRelationList(items?: Record<string, unknown>[]) {
  if (!items?.length) return undefined;
  return items.map((item) => item.name ?? item.title ?? item.roleTitle ?? item.relationType ?? item.worldRuleId ?? item.factionId ?? item.locationId ?? item.id).filter(Boolean).join('、');
}

function normalizeWorldRuleProfile(profile: WorldRuleProfile | WorldRule): { rule?: WorldRule; profile?: WorldRuleProfile } {
  if ('title' in profile) return { rule: profile };
  const rule = profile.worldRule ?? profile.rule;
  return { rule, profile };
}

function mergeSavedRecord(current: EntityRecord[], saved: EntityRecord) {
  const withoutDraft = current.filter((item) => !item.id.startsWith('local-'));
  return withoutDraft.some((item) => item.id === saved.id)
    ? withoutDraft.map((item) => (item.id === saved.id ? saved : item))
    : [saved, ...withoutDraft];
}

function draftRecord(config: ModuleConfig): EntityRecord {
  const nameKey = config.kind === 'rules' ? 'title' : 'name';
  const displayName = config.kind === 'rules' ? t('common.untitledRule') : t('common.newItem');
  return record(`local-${Date.now()}`, displayName, '', config.title, '', 0, { [nameKey]: undefined });
}

function recordToCharacterInput(values: Record<string, unknown>): CharacterInput {
  const input: CharacterInput = {
    name: typeof values.name === 'string' ? values.name.trim() : undefined,
    kind: asOptionalString(values.kind),
    role: asOptionalString(values.role),
    lifeStatus: asOptionalString(values.lifeStatus),
    personality: asOptionalString(values.personality),
    motivation: asOptionalString(values.motivation),
    background: asOptionalString(values.background),
    appearance: asOptionalString(values.appearance),
    voiceStyle: asOptionalString(values.voiceStyle),
    arc: asOptionalString(values.arc),
    importance: numberInput(values.importance),
  };
  return input;
}

function recordToLocationInput(values: Record<string, unknown>): LocationInput {
  return {
    name: asOptionalString(values.name),
    locationType: asOptionalString(values.locationType),
    narrativeRole: asOptionalString(values.narrativeRole),
    summary: asOptionalString(values.summary),
    description: asOptionalString(values.description),
    environment: asOptionalString(values.environment),
    atmosphere: asOptionalString(values.atmosphere),
    terrain: asOptionalString(values.terrain),
    climate: asOptionalString(values.climate),
    accessRule: asOptionalString(values.accessRule),
    dangerLevel: asOptionalString(values.dangerLevel),
    lifecycleStatus: asOptionalString(values.lifecycleStatus),
    visibility: asOptionalString(values.visibility),
    importance: numberInput(values.importance),
  };
}

function recordToFactionInput(values: Record<string, unknown>): FactionInput {
  return {
    name: asOptionalString(values.name),
    factionType: asOptionalString(values.factionType),
    narrativeRole: asOptionalString(values.narrativeRole),
    summary: asOptionalString(values.summary),
    description: asOptionalString(values.description),
    ideology: asOptionalString(values.ideology),
    goal: asOptionalString(values.goal),
    structure: asOptionalString(values.structure),
    resources: asOptionalString(values.resources),
    status: asOptionalString(values.status),
    visibility: asOptionalString(values.visibility),
    importance: numberInput(values.importance),
  };
}

function recordToSpeciesInput(values: Record<string, unknown>): SpeciesInput {
  return {
    name: asOptionalString(values.name),
    speciesType: asOptionalString(values.speciesType),
    narrativeRole: asOptionalString(values.narrativeRole),
    summary: asOptionalString(values.summary),
    description: asOptionalString(values.description),
    appearance: asOptionalString(values.appearance),
    lifespan: asOptionalString(values.lifespan),
    reproduction: asOptionalString(values.reproduction),
    socialStructure: asOptionalString(values.socialStructure),
    rarity: asOptionalString(values.rarity),
    status: asOptionalString(values.status),
    visibility: asOptionalString(values.visibility),
    importance: numberInput(values.importance),
  };
}

function recordToWorldRuleInput(values: Record<string, unknown>): WorldRuleInput {
  return {
    title: asOptionalString(values.title),
    ruleType: asOptionalString(values.ruleType),
    category: asOptionalString(values.category),
    priority: asOptionalString(values.priority),
    status: asOptionalString(values.status),
    summary: asOptionalString(values.summary),
    content: asOptionalString(values.content),
    condition: asOptionalString(values.condition),
    effect: asOptionalString(values.effect),
    cost: asOptionalString(values.cost),
    exception: asOptionalString(values.exception),
    violationConsequence: asOptionalString(values.violationConsequence),
    visibility: asOptionalString(values.visibility),
    importance: numberInput(values.importance),
  };
}

function numberInput(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  return typeof value === 'number' ? value : Number(value) || 0;
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [genres, setGenres] = useState<TaxonomyItem[]>([]);
  const [tags, setTags] = useState<TaxonomyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('shelf');
  const [creating, setCreating] = useState(false);
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('info');
  const [formApi, setFormApi] = useState<FormApi>();

  async function refresh(nextSelectedId?: string) {
    const response = await listProjects();
    const data = projectArray(response);
    setProjects(data);
    setSelectedId((current) => nextSelectedId ?? current ?? data[0]?.id);
  }

  useEffect(() => {
    Promise.all([refresh(), listGenres(), listTags()])
      .then(([, genreData, tagData]) => {
        setGenres(genreData);
        setTags(tagData);
      })
      .catch((error) => Notification.error({ title: t('messages.loadFailed'), content: String(error.message ?? error) }))
      .finally(() => setLoading(false));
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [projects, selectedId],
  );

  async function handleCreate(selection?: Pick<CreateProjectInput, 'genreIds' | 'tagIds'>) {
    if (!formApi) return;
    const values = { ...(await formApi.validate() as CreateProjectInput & { idea?: string }), ...selection };
    setCreating(true);
    try {
      const created = await createProject(normalizeInput(values));
      Notification.success({ title: t('projects.createSuccess') });
      formApi.reset();
      await refresh(created.id);
      setActiveSection('info');
      setViewMode('workspace');
    } catch (error) {
      Notification.error({ title: t('messages.createFailed'), content: String((error as Error).message ?? error) });
    } finally {
      setCreating(false);
    }
  }

  async function handleProjectUpdate(projectId: string, input: UpdateProjectInput) {
    const updated = await updateProject(projectId, input);
    setProjects((current) => current.map((project) => (project.id === updated.id ? updated : project)));
    Notification.success({ title: t('messages.saveSuccess') });
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      Notification.success({ title: t('projects.deleteSuccess') });
      const next = projects.find((project) => project.id !== id)?.id;
      await refresh(next);
      setViewMode('shelf');
    } catch (error) {
      Notification.error({ title: t('messages.deleteFailed'), content: String((error as Error).message ?? error) });
    }
  }

  if (viewMode === 'workspace') {
    return (
      <div style={{ minHeight: 'calc(100vh - 84px)' }}>
        <Workspace project={selectedProject} activeSection={activeSection} onSectionChange={setActiveSection} onBack={() => setViewMode('shelf')} onProjectUpdate={handleProjectUpdate} onDelete={handleDelete} />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 16, minHeight: 'calc(100vh - 84px)' }}>
      <aside style={{ background: 'var(--semi-color-bg-0)', border: '1px solid var(--semi-color-border)', borderRadius: 12, padding: 12 }}>
        <Button block theme="solid" type="primary" icon={<IconPlus />} onClick={() => setViewMode('manual-create')}>
          {t('actions.create')}
        </Button>
        <Text type="tertiary" style={{ display: 'block', margin: '12px 0 8px' }}>{t('projects.count', { count: projects.length })}</Text>
        {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={5} />} loading /> : projects.length === 0 ? (
          <Empty image={<IllustrationNoContent style={{ width: 120, height: 120 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 120, height: 120 }} />} title={t('projects.emptyTitle')} description={t('projects.emptyDescription')} style={{ padding: '32px 8px' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {projects.map((project) => {
              const genre = primaryGenre(project);
              const active = project.id === selectedProject?.id;
              return (
                <button key={project.id} type="button" onClick={() => { setSelectedId(project.id); setViewMode('shelf'); }} style={{ display: 'flex', width: '100%', gap: 10, padding: 10, textAlign: 'left', background: active ? 'var(--semi-color-primary-light-default)' : 'transparent', border: `1px solid ${active ? 'var(--semi-color-primary-light-active)' : 'transparent'}`, borderRadius: 10, cursor: 'pointer' }}>
                  <div style={{ width: 42, height: 52, borderRadius: 8, border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-fill-0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}><IconFile /></div>
                  <div style={{ minWidth: 0 }}>
                    <Text strong ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>{project.title}</Text>
                    <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>{genre?.name || t('projects.detail.noGenre')}</Text>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>
      <main>
        {viewMode === 'manual-create' && <ManualCreate genres={genres} tags={tags} setFormApi={setFormApi} creating={creating} onBack={() => setViewMode('shelf')} onCreate={handleCreate} />}
        {viewMode === 'shelf' && <ShelfDetail project={selectedProject} onEnter={() => { setActiveSection('info'); selectedProject && setViewMode('workspace'); }} onDelete={handleDelete} />}
      </main>
    </div>
  );
}

function ManualCreate({ genres, tags, setFormApi, creating, onBack, onCreate }: { genres: TaxonomyItem[]; tags: TaxonomyItem[]; setFormApi: React.ComponentProps<typeof Form>['getFormApi']; creating: boolean; onBack: () => void; onCreate: (selection?: Pick<CreateProjectInput, 'genreIds' | 'tagIds'>) => void }) {
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

  function toggleValue(values: string[], id: string) {
    return values.includes(id) ? values.filter((item) => item !== id) : [...values, id];
  }

  return (
    <Card style={{ minHeight: 'calc(100vh - 84px)', borderRadius: 12 }} bodyStyle={{ padding: 24 }}>
      <Button icon={<IconArrowLeft />} onClick={onBack}>{t('projects.creation.back')}</Button>
      <Title heading={3}>{t('projects.creation.manualTitle')}</Title>
      <Card style={{ maxWidth: 860, borderRadius: 12 }} bodyStyle={{ padding: 20 }}>
        <Form getFormApi={setFormApi} labelPosition="top">
          <Form.Input field="title" label={t('projects.creation.titleLabel')} placeholder={t('projects.creation.titlePlaceholder')} rules={[{ required: true, message: t('projects.creation.titleRequired') }]} />
          <TaxonomyChoiceGroup title={t('projects.creation.genreLabel')} description={t('projects.creation.genrePlaceholder')} items={genres} selectedIds={genreIds} onToggle={(id) => setGenreIds((current) => toggleValue(current, id))} />
          <TaxonomyChoiceGroup title={t('projects.creation.tagsLabel')} description={t('projects.creation.tagsPlaceholder')} items={tags} selectedIds={tagIds} onToggle={(id) => setTagIds((current) => toggleValue(current, id))} />
          <Form.TextArea field="summary" label={t('projects.creation.summaryLabel')} placeholder={t('projects.creation.summaryPlaceholder')} autosize={{ minRows: 3, maxRows: 5 }} />
          <Form.TextArea field="writingStyle" label={t('projects.creation.writingStyleLabel')} placeholder={t('projects.creation.writingStylePlaceholder')} autosize={{ minRows: 2, maxRows: 4 }} />
        </Form>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><Button theme="solid" type="primary" loading={creating} onClick={() => onCreate({ genreIds, tagIds })}>{t('projects.creation.submit')}</Button></div>
      </Card>
    </Card>
  );
}

function TaxonomyChoiceGroup({ title, description, items, selectedIds, onToggle }: { title: string; description: string; items: TaxonomyItem[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Text strong style={{ display: 'block', marginBottom: 4 }}>{title}</Text>
      <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 10 }}>{description}</Text>
      {items.length === 0 ? <Text type="tertiary">{t('common.notFilled')}</Text> : <Space wrap spacing={8} style={{ rowGap: 8 }}>{items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return <Button key={item.id} theme={selected ? 'solid' : 'light'} type={selected ? 'primary' : 'tertiary'} onClick={() => onToggle(item.id)}>{item.name}</Button>;
      })}</Space>}
    </div>
  );
}

function ShelfDetail({ project, onEnter, onDelete }: { project?: Project; onEnter: () => void; onDelete: (id: string) => void }) {
  if (!project) return <Card style={{ minHeight: 'calc(100vh - 84px)', borderRadius: 12 }}><Empty image={<IllustrationNoContent style={{ width: 160, height: 160 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 160, height: 160 }} />} title={t('projects.emptyTitle')} description={t('projects.detail.emptyDescription')} /></Card>;
  const genre = primaryGenre(project);
  return <Card style={{ minHeight: 'calc(100vh - 84px)', borderRadius: 12 }} bodyStyle={{ padding: 24 }}><ProjectHeader project={project} action={<Button theme="solid" type="primary" onClick={onEnter}>{t('projects.detail.enterWorkspace')}</Button>} onDelete={onDelete} /><ProjectShelfSummary project={project} genre={genre} /></Card>;
}

function Workspace({ project, activeSection, onSectionChange, onBack, onProjectUpdate, onDelete }: { project?: Project; activeSection: WorkspaceSection; onSectionChange: (section: WorkspaceSection) => void; onBack: () => void; onProjectUpdate: (projectId: string, input: UpdateProjectInput) => Promise<void>; onDelete: (id: string) => void }) {
  if (!project) return <ShelfDetail project={project} onEnter={() => undefined} onDelete={onDelete} />;
  return (
    <Card style={{ minHeight: 'calc(100vh - 84px)', borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div>
          <Text type="tertiary">{t('projects.workspace.currentNovel')}</Text>
          <Title heading={4} style={{ margin: '4px 0 0' }}>{project.title}</Title>
        </div>
        <Button icon={<IconArrowLeft />} onClick={onBack}>{t('projects.workspace.back')}</Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', minHeight: 'calc(100vh - 153px)' }}>
        <aside style={{ borderRight: '1px solid var(--semi-color-border)', padding: 16 }}>
          <Space vertical align="start" spacing={4} style={{ width: '100%' }}>
            {workspaceSections.map((key) => <Button key={key} block theme={activeSection === key ? 'light' : 'borderless'} onClick={() => onSectionChange(key)}>{t(`projects.workspace.nav.${key}`)}</Button>)}
          </Space>
        </aside>
        <main style={{ padding: 24 }}>
          {activeSection === 'info' ? <ProjectInfoPanel project={project} onSave={(input) => onProjectUpdate(project.id, input)} onDelete={onDelete} /> : <EntityModule projectId={project.id} config={moduleConfigs[activeSection]} />}
        </main>
      </div>
    </Card>
  );
}

function ProjectHeader({ project, action, onDelete }: { project: Project; action?: React.ReactNode; onDelete: (id: string) => void }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '76px minmax(0, 1fr) auto', gap: 16, alignItems: 'start', paddingBottom: 20, borderBottom: '1px solid var(--semi-color-border)' }}><div style={{ width: 76, height: 96, borderRadius: 10, border: '1px solid var(--semi-color-border)', background: 'var(--semi-color-fill-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconFile size="extra-large" /></div><div style={{ minWidth: 0 }}><Title heading={3} style={{ margin: 0 }}>{project.title}</Title><Space spacing={6} wrap style={{ marginTop: 10 }}>{project.genres.map(({ genre }) => <Tag key={genre.id} color="blue">{genre.name}</Tag>)}{project.tags.map(({ tag }) => <Tag key={tag.id}>{tag.name}</Tag>)}</Space></div><Space>{action}<Popconfirm title={t('projects.detail.deleteTitle')} content={t('projects.detail.deleteContent')} onConfirm={() => onDelete(project.id)}><Button icon={<IconDelete />} type="danger" theme="borderless" /></Popconfirm></Space></div>;
}

function ProjectShelfSummary({ project, genre }: { project: Project; genre?: TaxonomyItem }) {
  const metaItems = [
    { label: t('projects.creation.genreLabel'), value: genre?.name || t('projects.detail.noGenre') },
    { label: t('projects.detail.createdAt'), value: formatDate(project.createdAt) },
    { label: t('projects.detail.updatedAt'), value: formatDate(project.updatedAt) },
  ];

  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, marginTop: 18 }}><div style={{ display: 'grid', gap: 12 }}><section style={{ padding: 16, border: '1px solid var(--semi-color-border)', borderRadius: 12, background: 'var(--semi-color-bg-0)' }}><Title heading={5} style={{ margin: '0 0 8px' }}>{t('projects.detail.intro')}</Title><Paragraph type={project.summary ? undefined : 'tertiary'} style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{displayText(project.summary)}</Paragraph></section><section style={{ padding: 16, border: '1px solid var(--semi-color-border)', borderRadius: 12, background: 'var(--semi-color-bg-0)' }}><Title heading={5} style={{ margin: '0 0 8px' }}>{t('projects.detail.writingStyle')}</Title><Paragraph type={project.writingStyle ? undefined : 'tertiary'} style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.7 }}>{displayText(project.writingStyle)}</Paragraph></section></div><aside style={{ display: 'grid', gap: 10, alignContent: 'start' }}>{metaItems.map((item) => <div key={item.label} style={{ padding: '10px 12px', border: '1px solid var(--semi-color-border)', borderRadius: 10, background: 'var(--semi-color-fill-0)' }}><Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 4 }}>{item.label}</Text><Text strong={item.label === t('projects.creation.genreLabel')}>{item.value}</Text></div>)}</aside></div>;
}

function ProjectInfoPanel({ project, onSave, onDelete }: { project: Project; onSave: (input: UpdateProjectInput) => Promise<void>; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();

  async function handleSave() {
    if (!formApi) return;
    const values = await formApi.validate() as Record<string, unknown>;
    const input = projectInfoGroups.flatMap((group) => group.fields).reduce<Record<string, unknown>>((acc, field) => {
      acc[field.key] = values[field.key] === '' ? undefined : values[field.key];
      return acc;
    }, {});
    setSaving(true);
    try {
      await onSave(input as UpdateProjectInput);
      setEditing(false);
    } catch (error) {
      Notification.error({ title: t('messages.updateFailed'), content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  return <ModuleShell title={t('projects.workspace.nav.info')} description={t('projects.workspace.info.description')} action={!editing ? <Space><Button icon={<IconEdit />} onClick={() => setEditing(true)}>{t('actions.edit')}</Button><Popconfirm title={t('projects.detail.deleteTitle')} content={t('projects.detail.deleteContent')} onConfirm={() => onDelete(project.id)}><Button icon={<IconDelete />} type="danger" theme="borderless">{t('actions.delete')}</Button></Popconfirm></Space> : <Space><Button onClick={() => setEditing(false)}>{t('actions.cancel')}</Button><Button theme="solid" type="primary" loading={saving} onClick={handleSave}>{t('actions.save')}</Button></Space>}>
    {editing ? <Form key={project.id} initValues={project} getFormApi={setFormApi} labelPosition="top"><GroupedForm groups={projectInfoGroups} longFields={projectLongFields} /></Form> : <GroupedDetails groups={projectInfoGroups} values={project as unknown as Record<string, unknown>} />}
  </ModuleShell>;
}

async function loadEntityRecords(projectId: string, kind: ModuleKind): Promise<EntityRecord[]> {
  switch (kind) {
    case 'characters':
      return itemsFromResponse<Character>(await listCharacters(projectId)).map(characterToRecord);
    case 'locations':
      return itemsFromResponse<Location>(await listLocations(projectId)).map((location) => locationToRecord(location));
    case 'factions': {
      const response = await listFactions(projectId);
      const items = itemsFromResponse<Faction>(response);
      return items.map((faction) => factionToRecord(faction));
    }
    case 'species':
      return itemsFromResponse<Species>(await listSpecies(projectId)).map((species) => speciesToRecord(species));
    case 'rules':
      return itemsFromResponse<WorldRule>(await listWorldRules(projectId)).map((rule) => worldRuleToRecord(rule));
  }
}

async function loadEntityProfileRecord(projectId: string, kind: ModuleKind, entityId: string): Promise<EntityRecord | undefined> {
  switch (kind) {
    case 'locations': {
      const profile = await getLocationProfile(projectId, entityId);
      return locationToRecord(profile.location, profile);
    }
    case 'factions': {
      const profile = await getFactionProfile(projectId, entityId);
      return factionToRecord(profile.faction, profile);
    }
    case 'species': {
      const profile = await getSpeciesProfile(projectId, entityId);
      return speciesToRecord(profile.species, profile);
    }
    case 'rules': {
      const profile = await getWorldRuleProfile(projectId, entityId);
      const { rule, profile: normalizedProfile } = normalizeWorldRuleProfile(profile);
      return rule ? worldRuleToRecord(rule, normalizedProfile) : undefined;
    }
    default:
      return undefined;
  }
}

async function saveEntityRecord(projectId: string, kind: ModuleKind, selected: EntityRecord, values: Record<string, unknown>) {
  const isNew = selected.id.startsWith('local-');
  switch (kind) {
    case 'characters': {
      const input = recordToCharacterInput(values);
      return characterToRecord(isNew ? await createCharacter(projectId, input) : await updateCharacter(projectId, selected.id, input));
    }
    case 'locations': {
      const input = recordToLocationInput(values);
      return locationToRecord(isNew ? await createLocation(projectId, input) : await updateLocation(projectId, selected.id, input));
    }
    case 'factions': {
      const input = recordToFactionInput(values);
      return factionToRecord(isNew ? await createFaction(projectId, input) : await updateFaction(projectId, selected.id, input));
    }
    case 'species': {
      const input = recordToSpeciesInput(values);
      return speciesToRecord(isNew ? await createSpecies(projectId, input) : await updateSpecies(projectId, selected.id, input));
    }
    case 'rules': {
      const input = recordToWorldRuleInput(values);
      return worldRuleToRecord(isNew ? await createWorldRule(projectId, input) : await updateWorldRule(projectId, selected.id, input));
    }
  }
}

async function deleteEntityRecord(projectId: string, kind: ModuleKind, entityId: string) {
  switch (kind) {
    case 'characters':
      await deleteCharacter(projectId, entityId);
      return;
    case 'locations':
      await deleteLocation(projectId, entityId);
      return;
    case 'factions':
      await deleteFaction(projectId, entityId);
      return;
    case 'species':
      await deleteSpecies(projectId, entityId);
      return;
    case 'rules':
      await deleteWorldRule(projectId, entityId);
      return;
  }
}

function EntityModule({ projectId, config }: { projectId: string; config: ModuleConfig }) {
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterState>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();
  const [loadError, setLoadError] = useState<string>();

  const loadRecords = useCallback(async (preferredId?: string) => {
    setLoading(true);
    setLoadError(undefined);
    try {
      const next = await loadEntityRecords(projectId, config.kind);
      setRecords(next);
      setSelectedId((current) => preferredId ?? (current && next.some((item) => item.id === current) ? current : next[0]?.id));
      return next;
    } catch (error) {
      const message = String((error as Error).message ?? error);
      setLoadError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [config.kind, projectId]);

  useEffect(() => {
    let cancelled = false;
    setEditing(false);
    setSelectedId(undefined);
    setLoadError(undefined);
    setLoading(true);
    loadEntityRecords(projectId, config.kind)
      .then((next) => {
        if (cancelled) return;
        setRecords(next);
        setSelectedId(next[0]?.id);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(String((error as Error).message ?? error));
        Notification.error({ title: t('messages.loadFailed'), content: String((error as Error).message ?? error) });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config.kind, projectId]);

  useEffect(() => {
    if (!selectedId || selectedId.startsWith('local-')) return;
    let cancelled = false;
    loadEntityProfileRecord(projectId, config.kind, selectedId)
      .then((profileRecord) => {
        if (!cancelled && profileRecord) {
          setRecords((current) => current.map((item) => (item.id === selectedId ? profileRecord : item)));
          setLoadError(undefined);
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(String((error as Error).message ?? error));
        Notification.error({ title: t('messages.loadFailed'), content: String((error as Error).message ?? error) });
      });
    return () => {
      cancelled = true;
    };
  }, [config.kind, projectId, selectedId]);

  const selected = records.find((recordItem) => recordItem.id === selectedId) ?? records[0];
  const typeOptions = [...new Set(records.map((recordItem) => recordItem.type).filter(Boolean))] as string[];
  const statusOptions = [...new Set(records.map((recordItem) => recordItem.status).filter(Boolean))] as string[];
  const visibleRecords = records.filter((recordItem) => {
    const text = [recordItem.name, recordItem.summary, recordItem.type, recordItem.status, ...Object.values(recordItem.fields)].join(' ').toLowerCase();
    const matchQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchType = !filter.type || recordItem.type === filter.type;
    const matchStatus = !filter.status || recordItem.status === filter.status;
    const matchImportance = !filter.importance || (filter.importance === 'high' ? (recordItem.importance ?? 0) >= 7 : (recordItem.importance ?? 0) < 7);
    return matchQuery && matchType && matchStatus && matchImportance;
  });
  const hasActiveSearch = Boolean(query.trim()) || !isEmptyFilter(filter);
  const emptyTitle = hasActiveSearch ? t('modules.emptyAfterFilter') : t('modules.emptyModuleTitle');
  const emptyDescription = hasActiveSearch ? t('modules.emptyFilterDescription') : t('modules.emptyModuleDescription');
  const listEmpty = <Empty title={emptyTitle} description={emptyDescription} image={<IllustrationNoContent style={{ width: 120, height: 120 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 120, height: 120 }} />} />;
  const detailEmpty = <Empty title={t('common.detailPlaceholder')} description={t('modules.noSelectionDescription')} image={<IllustrationNoContent style={{ width: 120, height: 120 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 120, height: 120 }} />} />;
  const errorEmpty = loadError ? <Empty title={t('modules.loadErrorTitle', { module: config.title })} description={t('modules.loadErrorDescription')} image={<IllustrationNoContent style={{ width: 120, height: 120 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 120, height: 120 }} />} /> : undefined;

  function clearFilter() {
    setFilter({});
    setQuery('');
  }

  function handleAdd() {
    const fresh = draftRecord(config);
    setRecords((current) => [fresh, ...current.filter((item) => !item.id.startsWith('local-'))]);
    setSelectedId(fresh.id);
    setEditing(true);
  }

  function handleCancelEdit() {
    if (selected?.id.startsWith('local-')) {
      const nextRecords = records.filter((item) => item.id !== selected.id);
      setRecords(nextRecords);
      setSelectedId(nextRecords[0]?.id);
    }
    setEditing(false);
  }

  function handleSelectRecord(recordId: string) {
    setRecords((current) => current.filter((item) => !item.id.startsWith('local-') || item.id === recordId));
    setSelectedId(recordId);
    setEditing(false);
  }

  async function handleSave() {
    if (!formApi || !selected) return;
    const values = await formApi.validate() as Record<string, unknown>;
    setSaving(true);
    try {
      const saved = await saveEntityRecord(projectId, config.kind, selected, values);
      setRecords((current) => mergeSavedRecord(current, saved));
      setSelectedId(saved.id);
      loadRecords(saved.id).catch((error) => Notification.error({ title: t('messages.loadFailed'), content: String((error as Error).message ?? error) }));
      Notification.success({ title: t('messages.saveSuccess') });
      setEditing(false);
    } catch (error) {
      Notification.error({ title: t('messages.updateFailed'), content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    try {
      if (!selected.id.startsWith('local-')) {
        await deleteEntityRecord(projectId, config.kind, selected.id);
      }
      const nextRecords = records.filter((item) => item.id !== selected.id);
      setRecords(nextRecords);
      setSelectedId(nextRecords[0]?.id);
      setEditing(false);
    } catch (error) {
      Notification.error({ title: t('messages.deleteFailed'), content: String((error as Error).message ?? error) });
    }
  }

  return <ModuleShell title={config.title} description={config.description} action={<Button theme="solid" type="primary" icon={<IconPlus />} onClick={handleAdd}>{config.addLabel}</Button>}>
    <Card style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
      <Space wrap spacing={8} style={{ width: '100%', rowGap: 8 }}>
        <Input prefix={<IconSearch />} placeholder={t('modules.searchPlaceholder')} value={query} onChange={setQuery} style={{ width: 260 }} />
        <Select placeholder={t('modules.typeFilter')} value={filter.type} onChange={(value) => setFilter((current) => ({ ...current, type: value as string }))} showClear style={{ width: 160 }}>{typeOptions.map((option) => <Select.Option key={option} value={option}>{option}</Select.Option>)}</Select>
        <Select placeholder={t('modules.statusFilter')} value={filter.status} onChange={(value) => setFilter((current) => ({ ...current, status: value as string }))} showClear style={{ width: 140 }}>{statusOptions.map((option) => <Select.Option key={option} value={option}>{option}</Select.Option>)}</Select>
        <Select placeholder={t('modules.importanceFilter')} value={filter.importance} onChange={(value) => setFilter((current) => ({ ...current, importance: value as string }))} showClear style={{ width: 140 }}><Select.Option value="high">7+</Select.Option><Select.Option value="normal">0-6</Select.Option></Select>
        {filter.type ? <Tag closable onClose={() => setFilter((current) => ({ ...current, type: undefined }))}>{t('modules.typeFilter')}: {filter.type}</Tag> : null}
        {filter.status ? <Tag closable onClose={() => setFilter((current) => ({ ...current, status: undefined }))}>{t('modules.statusFilter')}: {filter.status}</Tag> : null}
        {filter.importance ? <Tag closable onClose={() => setFilter((current) => ({ ...current, importance: undefined }))}>{t('modules.importanceFilter')}: {filter.importance}</Tag> : null}
        {(!isEmptyFilter(filter) || query) ? <Button theme="borderless" onClick={clearFilter}>{t('actions.clear')}</Button> : null}
      </Space>
    </Card>
    <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16 }}>
      <Card style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 12 }}>
        {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading /> : errorEmpty ?? (visibleRecords.length === 0 ? listEmpty : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{visibleRecords.map((recordItem) => <button key={recordItem.id} type="button" onClick={() => handleSelectRecord(recordItem.id)} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${recordItem.id === selected?.id ? 'var(--semi-color-primary-light-active)' : 'var(--semi-color-border)'}`, background: recordItem.id === selected?.id ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', cursor: 'pointer' }}><Text strong ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>{recordItem.name}</Text><Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ display: 'block', marginTop: 4 }}>{recordItem.summary || recordItem.type || config.metaFallback}</Text><Space spacing={4} style={{ marginTop: 8 }}>{recordItem.type ? <Tag size="small">{recordItem.type}</Tag> : null}{recordItem.status ? <Tag size="small" color="blue">{recordItem.status}</Tag> : null}</Space></button>)}</div>)}
      </Card>
      <Card style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 20 }}>
        {!selected ? detailEmpty : <><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}><div><Title heading={4} style={{ margin: 0 }}>{selected.name}</Title><Text type="tertiary">{selected.updatedAt ? formatDate(selected.updatedAt) : config.metaFallback}</Text></div>{editing ? <Space><Button onClick={handleCancelEdit}>{t('actions.cancel')}</Button><Button theme="solid" type="primary" loading={saving} onClick={handleSave}>{t('actions.save')}</Button></Space> : <Space><Button icon={<IconEdit />} onClick={() => setEditing(true)}>{t('actions.edit')}</Button><Popconfirm title={t('modules.deleteTitle')} content={t('modules.deleteContent')} onConfirm={handleDelete}><Button icon={<IconDelete />} type="danger" theme="borderless">{t('actions.delete')}</Button></Popconfirm></Space>}</div>{editing ? <Form key={selected.id} initValues={selected.fields} getFormApi={setFormApi} labelPosition="top"><GroupedForm groups={config.groups} nameLabel={config.nameLabel} namePlaceholder={config.namePlaceholder} /></Form> : <GroupedDetails groups={config.groups} values={selected.fields} />}</>}
      </Card>
    </div>
  </ModuleShell>;
}

function ModuleShell({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div><section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 16 }}><div><Title heading={3} style={{ margin: 0 }}>{title}</Title><Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>{description}</Text></div>{action}</section>{children}</div>;
}

function GroupedDetails({ groups, values }: { groups: DetailGroup[]; values: Record<string, unknown> }) {
  return <div style={{ display: 'grid', gap: 16 }}>{groups.map((group) => <section key={group.title} style={{ width: '100%', padding: '2px 0 14px', borderBottom: '1px solid var(--semi-color-border)' }}><Title heading={5} style={{ margin: '0 0 10px' }}>{group.title}</Title><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', columnGap: 24, rowGap: 14 }}>{group.fields.map((field) => <DetailCard key={field.key} field={field} value={values[field.key]} />)}</div></section>)}</div>;
}

function DetailCard({ field, value }: { field: DetailField; value: unknown }) {
  const empty = isEmptyDisplayValue(value);
  const relation = isRelationField(field.key);
  const items = relationItems(value);
  const text = displayText(value);
  const shouldSpan = relation ? items.length > 2 : Boolean(field.long && !empty && text.length > 48);

  return <div style={{ gridColumn: shouldSpan ? '1 / -1' : undefined, minWidth: 0, padding: shouldSpan ? '2px 0 8px' : '2px 0 6px' }}><Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 4, lineHeight: 1.35 }}>{field.label}</Text>{relation && items.length > 0 ? <Space wrap spacing={6} style={{ rowGap: 6 }}>{items.map((item) => <Tag key={item} size="small">{item}</Tag>)}</Space> : <Paragraph type={empty ? 'tertiary' : undefined} ellipsis={!shouldSpan ? { rows: 2, showTooltip: true } : undefined} style={{ whiteSpace: shouldSpan ? 'pre-wrap' : undefined, margin: 0, lineHeight: 1.55 }}>{text}</Paragraph>}</div>;
}

function GroupedForm({ groups, nameLabel, namePlaceholder, longFields }: { groups: DetailGroup[]; nameLabel?: string; namePlaceholder?: string; longFields?: Set<string> }) {
  return <Space vertical align="start" spacing={18} style={{ width: '100%' }}>{groups.map((group) => <section key={group.title} style={{ width: '100%' }}><Title heading={5}>{group.title}</Title><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>{group.fields.map((field) => {
    const isLong = field.long || longFields?.has(field.key);
    const label = field.key === 'name' && nameLabel ? nameLabel : field.label;
    const placeholder = field.key === 'name' ? namePlaceholder : undefined;
    const rules = field.key === 'name' ? [{ required: true, message: t('modules.formNameRequired') }] : field.key === 'title' ? [{ required: true, message: t('modules.formTitleRequired') }] : undefined;
    if (isLong) return <Form.TextArea key={field.key} field={field.key} label={label} placeholder={placeholder} autosize={{ minRows: 3, maxRows: 8 }} style={{ gridColumn: '1 / -1' }} initValue={formValue(undefined)} rules={rules} />;
    if (field.key === 'importance' || field.key === 'estimatedChapters' || field.key === 'wordsPerChapter') return <Form.InputNumber key={field.key} field={field.key} label={label} style={{ width: '100%' }} />;
    return <Form.Input key={field.key} field={field.key} label={label} placeholder={placeholder} rules={rules} />;
  })}</div></section>)}</Space>;
}

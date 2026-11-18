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
  SideSheet,
  Skeleton,
  Space,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconArrowLeft, IconDelete, IconEdit, IconFile, IconPlus, IconSearch } from '@douyinfe/semi-icons';
import { t } from '../../shared/i18n';
import {
  createAbility,
  createAbilityRule,
  createCharacter,
  createCharacterIdentity,
  createCharacterState,
  createFaction,
  createFactionMembership,
  createFactionRelation,
  createFactionRule,
  createFactionState,
  createLocation,
  createLocationFaction,
  createLocationRule,
  createLocationState,
  createProject,
  createRelationship,
  createSpecies,
  createSpeciesAbility,
  createSpeciesRule,
  createSpeciesTrait,
  createStoryItem,
  createStoryItemRule,
  createStoryItemState,
  createWorldItem,
  createWorldRule,
  deleteAbility,
  deleteAbilityRule,
  deleteCharacter,
  deleteCharacterIdentity,
  deleteCharacterState,
  deleteFaction,
  deleteFactionMembership,
  deleteFactionRelation,
  deleteFactionRule,
  deleteFactionState,
  deleteLocation,
  deleteLocationFaction,
  deleteLocationRule,
  deleteLocationState,
  deleteProject,
  deleteRelationship,
  deleteSpecies,
  deleteSpeciesAbility,
  deleteSpeciesRule,
  deleteSpeciesTrait,
  deleteStoryItem,
  deleteStoryItemRule,
  deleteStoryItemState,
  deleteWorldItem,
  deleteWorldRule,
  getAbilityProfile,
  getFactionProfile,
  getLocationProfile,
  getSpeciesProfile,
  getStoryItemProfile,
  getWorldRuleProfile,
  listAbilities,
  listAbilityRules,
  listCharacters,
  listCharacterIdentities,
  listCharacterStates,
  listFactions,
  listFactionMemberships,
  listFactionRelations,
  listFactionRules,
  listFactionStates,
  listGenres,
  listLocations,
  listLocationFactions,
  listLocationRules,
  listLocationStates,
  listProjects,
  listRelationships,
  listSpecies,
  listSpeciesAbilities,
  listSpeciesRules,
  listSpeciesTraits,
  listStoryItems,
  listStoryItemRules,
  listStoryItemStates,
  listTags,
  listWorldItems,
  listWorldRules,
  updateAbility,
  updateAbilityRule,
  updateCharacter,
  updateCharacterIdentity,
  updateCharacterState,
  updateFaction,
  updateFactionMembership,
  updateFactionRelation,
  updateFactionRule,
  updateFactionState,
  updateLocation,
  updateLocationFaction,
  updateLocationRule,
  updateLocationState,
  updateProject,
  updateSpecies,
  updateSpeciesAbility,
  updateSpeciesRule,
  updateSpeciesTrait,
  updateStoryItem,
  updateStoryItemRule,
  updateStoryItemState,
  updateWorldItem,
  updateWorldRule,
} from './api';
import type {
  Ability,
  AbilityInput,
  AbilityProfile,
  AbilityRuleInput,
  Character,
  CharacterIdentityInput,
  CharacterInput,
  CharacterStateInput,
  CreateProjectInput,
  EntityRecord,
  Faction,
  FactionInput,
  FactionMembershipInput,
  FactionProfile,
  FactionRelationInput,
  FactionRuleInput,
  FactionStateInput,
  Location,
  LocationFactionInput,
  LocationInput,
  LocationProfile,
  LocationRuleInput,
  LocationStateInput,
  Project,
  Relationship,
  RelationshipEntityType,
  RelationshipInput,
  Species,
  SpeciesAbilityInput,
  SpeciesInput,
  SpeciesProfile,
  SpeciesRuleInput,
  SpeciesTraitInput,
  StoryItem,
  StoryItemInput,
  StoryItemProfile,
  StoryItemRuleInput,
  StoryItemStateInput,
  TaxonomyItem,
  UpdateProjectInput,
  WorldRule,
  WorldItem,
  WorldItemInput,
  WorldRuleInput,
  WorldRuleProfile,
} from './types';

const { Title, Text, Paragraph } = Typography;
type ViewMode = 'shelf' | 'manual-create' | 'workspace';
type WorkspaceSection = 'info' | 'characters' | 'locations' | 'factions' | 'species' | 'rules' | 'worldItems' | 'assets';
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type ModuleKind = 'characters' | 'locations' | 'factions' | 'species' | 'rules' | 'worldItems' | 'storyItems' | 'abilities';
type RelationshipTargetType = Exclude<RelationshipEntityType, 'chapter' | 'chapter_plan'>;
type RelationshipTargetOption = { type: RelationshipTargetType; id: string; label: string; summary?: string };
type DetailField = { key: string; label: string; long?: boolean; options?: Array<{ label: string; value: string }> };
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
type SubResourceKind = 'characterStates' | 'characterIdentities' | 'locationStates' | 'locationRules' | 'locationFactions' | 'factionStates' | 'factionMemberships' | 'factionRelations' | 'factionRules' | 'speciesTraits' | 'speciesAbilities' | 'speciesRules' | 'storyItemStates' | 'storyItemRules' | 'abilityRules';
type SubResourceRecord = { id: string; title: string; meta?: string | null; summary?: string | null; updatedAt?: string; fields: Record<string, unknown> };
type SubResourceConfig = { kind: SubResourceKind; title: string; addLabel: string; parentIdName: string; titleField: string; metaFields: string[]; fields: DetailField[]; requiredFields?: string[]; booleanFields?: string[]; numberFields?: string[]; longFields?: string[]; defaults?: Record<string, unknown> };

const workspaceSections: WorkspaceSection[] = ['info', 'characters', 'locations', 'factions', 'species', 'rules', 'worldItems', 'assets'];
const localEntityIdPrefixes = ['local-', 'sample-', 'placeholder-', 'example-'] as const;
const worldItemTypeOptions = [
  { value: 'system', label: 'system' },
  { value: 'history', label: 'history' },
  { value: 'culture', label: 'culture' },
  { value: 'concept', label: 'concept' },
  { value: 'social_system', label: 'social_system' },
  { value: 'custom', label: 'custom' },
];
const allowedWorldItemTypes = new Set(worldItemTypeOptions.map((option) => option.value));

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

  storyItems: {
    kind: 'storyItems',
    title: t('modules.storyItems.title'),
    description: t('modules.storyItems.description'),
    addLabel: t('modules.storyItems.add'),
    nameLabel: t('modules.storyItems.nameLabel'),
    namePlaceholder: t('modules.storyItems.namePlaceholder'),
    metaFallback: t('modules.storyItems.listMetaFallback'),
    groups: [
      { title: t('modules.sections.itemBasic'), fields: fields(['name', 'itemType', 'narrativeRole', 'summary', 'importance']) },
      { title: t('modules.sections.itemSetting'), fields: fields(['description', 'origin', 'appearance', 'function', 'effect'], true) },
      { title: t('modules.sections.itemUsage'), fields: fields(['cost', 'limitation', 'owner', 'location', 'lifecycleStatus', 'visibility']) },
      { title: t('modules.sections.itemRelations'), fields: fields(['relatedRules', 'notes'], true) },
    ],
  },
  abilities: {
    kind: 'abilities',
    title: t('modules.abilities.title'),
    description: t('modules.abilities.description'),
    addLabel: t('modules.abilities.add'),
    nameLabel: t('modules.abilities.nameLabel'),
    namePlaceholder: t('modules.abilities.namePlaceholder'),
    metaFallback: t('modules.abilities.listMetaFallback'),
    groups: [
      { title: t('modules.sections.abilityBasic'), fields: fields(['name', 'abilityType', 'narrativeRole', 'summary', 'importance']) },
      { title: t('modules.sections.abilityMechanism'), fields: fields(['description', 'condition', 'effect', 'cost', 'limitation'], true) },
      { title: t('modules.sections.abilityGrowth'), fields: fields(['source', 'progression', 'masteryNotes', 'countermeasure', 'visibility'], true) },
      { title: t('modules.sections.abilityRelations'), fields: fields(['relatedRules', 'notes'], true) },
    ],
  },
  worldItems: {
    kind: 'worldItems',
    title: t('modules.worldItems.title'),
    description: t('modules.worldItems.description'),
    addLabel: t('modules.worldItems.add'),
    nameLabel: t('modules.worldItems.nameLabel'),
    namePlaceholder: t('modules.worldItems.namePlaceholder'),
    metaFallback: t('modules.worldItems.listMetaFallback'),
    groups: [
      { title: t('modules.sections.worldItemBasic'), fields: [{ key: 'name', label: t('modules.fields.name') }, { key: 'type', label: t('modules.fields.type'), options: worldItemTypeOptions }, { key: 'summary', label: t('modules.fields.summary') }, { key: 'importance', label: t('modules.fields.importance') }] },
      { title: t('modules.sections.worldItemContent'), fields: fields(['content', 'visibility', 'tags'], true) },
      { title: t('modules.sections.worldItemRelations'), fields: fields(['notes'], true) },
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

const moduleEntityType: Record<ModuleKind, RelationshipTargetType> = {
  characters: 'character',
  locations: 'location',
  factions: 'faction',
  species: 'species',
  storyItems: 'story_item',
  abilities: 'ability',
  rules: 'world_rule',
  worldItems: 'world_item',
};

const relationshipTargetTypes: Array<{ value: RelationshipTargetType; label: string }> = [
  { value: 'character', label: '人物' },
  { value: 'location', label: '地点' },
  { value: 'faction', label: '势力' },
  { value: 'species', label: '物种' },
  { value: 'story_item', label: '道具' },
  { value: 'ability', label: '能力' },
  { value: 'world_rule', label: '世界规则' },
  { value: 'world_item', label: '通用设定' },
];

const relationshipTypeOptions = ['ally', 'rival', 'enemy', 'mentor', 'student', 'family', 'born_in', 'lives_in', 'visited', 'protects_place', 'owns', 'seeks', 'uses', 'learns', 'teaches', 'contains', 'amplifies', 'influenced_by', 'appears_in', 'related_to'];

const subFieldLabels: Record<string, string> = {
  title: '身份标题', description: '描述', type: '类型', isPublic: '公开', startsAt: '开始', endsAt: '结束', importance: '重要度',
  chapterId: '章节 ID', stage: '阶段', orderIndex: '排序', location: '位置', physicalState: '身体状态', emotionalState: '情绪状态', goal: '目标', knownSecrets: '已知秘密', relationshipChanges: '关系变化', statusNote: '状态备注',
  lifecycleStatus: '生命周期状态', dangerLevel: '危险等级', accessRule: '进入规则', visibility: '可见性', environmentChanges: '环境变化', controlSummary: '控制情况', eventSummary: '事件摘要', stateNote: '状态备注',
  worldRuleId: '世界规则 ID', relationType: '关系类型', isPrimary: '主规则', enforcementLevel: '执行强度', notes: '备注',
  factionId: '势力 ID', influenceLevel: '影响力', isCurrent: '当前有效',
  status: '状态', powerLevel: '权力等级', resourceState: '资源状态', internalState: '内部状态', publicReputation: '公众声誉', conflictSummary: '冲突摘要',
  characterId: '人物 ID', membershipType: '成员类型', roleTitle: '角色头衔', rank: '等级', department: '部门',
  targetFactionId: '目标势力 ID', direction: '方向', strength: '强度',
  traitType: '特征类型', name: '名称', summary: '简介', isInheritable: '可遗传', isCommon: '常见',
  aliases: '别名', abilityType: '能力类型', effect: '效果', cost: '代价', limitation: '限制', condition: '条件', inheritanceType: '遗传类型', awakeningCondition: '觉醒条件', masteryNotes: '掌握要点', isUnique: '唯一',
  owner: '持有者', powerState: '力量状态', sourceType: '来源类型', sourceId: '来源 ID',
};

function subFields(keys: string[], longKeys: string[] = []): DetailField[] {
  return keys.map((key) => ({ key, label: subFieldLabels[key] ?? key, long: longKeys.includes(key) }));
}

const ruleRelationFields = subFields(['worldRuleId', 'relationType', 'isPrimary', 'enforcementLevel', 'orderIndex', 'notes'], ['notes']);
const subResourceConfigs: Partial<Record<ModuleKind, SubResourceConfig[]>> = {
  characters: [
    { kind: 'characterStates', title: '人物状态', addLabel: '新增状态', parentIdName: 'characterId', titleField: 'stage', metaFields: ['location', 'goal'], fields: subFields(['stage', 'orderIndex', 'chapterId', 'location', 'physicalState', 'emotionalState', 'goal', 'knownSecrets', 'relationshipChanges', 'statusNote'], ['knownSecrets', 'relationshipChanges', 'statusNote']), numberFields: ['orderIndex'], longFields: ['knownSecrets', 'relationshipChanges', 'statusNote'], defaults: { orderIndex: 0 } },
    { kind: 'characterIdentities', title: '人物身份', addLabel: '新增身份', parentIdName: 'characterId', titleField: 'title', metaFields: ['type', 'importance'], fields: subFields(['title', 'type', 'isPublic', 'importance', 'startsAt', 'endsAt', 'description'], ['description']), requiredFields: ['title'], booleanFields: ['isPublic'], numberFields: ['importance'], defaults: { isPublic: false, importance: 0 } },
  ],
  locations: [
    { kind: 'locationStates', title: '地点状态', addLabel: '新增状态', parentIdName: 'locationId', titleField: 'stage', metaFields: ['lifecycleStatus', 'dangerLevel'], fields: subFields(['stage', 'orderIndex', 'chapterId', 'lifecycleStatus', 'dangerLevel', 'accessRule', 'visibility', 'environmentChanges', 'controlSummary', 'eventSummary', 'stateNote'], ['environmentChanges', 'controlSummary', 'eventSummary', 'stateNote']), numberFields: ['orderIndex'], defaults: { orderIndex: 0 } },
    { kind: 'locationRules', title: '地点规则', addLabel: '关联规则', parentIdName: 'locationId', titleField: 'worldRuleId', metaFields: ['relationType', 'enforcementLevel'], fields: ruleRelationFields, requiredFields: ['worldRuleId'], booleanFields: ['isPrimary'], numberFields: ['orderIndex'], defaults: { isPrimary: false, orderIndex: 0 } },
    { kind: 'locationFactions', title: '地点势力', addLabel: '关联势力', parentIdName: 'locationId', titleField: 'factionId', metaFields: ['relationType', 'influenceLevel'], fields: subFields(['factionId', 'relationType', 'influenceLevel', 'isCurrent', 'startsAt', 'endsAt', 'notes'], ['notes']), requiredFields: ['factionId'], booleanFields: ['isCurrent'], defaults: { isCurrent: true } },
  ],
  factions: [
    { kind: 'factionStates', title: '势力状态', addLabel: '新增状态', parentIdName: 'factionId', titleField: 'stage', metaFields: ['status', 'powerLevel'], fields: subFields(['stage', 'orderIndex', 'chapterId', 'status', 'powerLevel', 'influenceLevel', 'resourceState', 'internalState', 'publicReputation', 'goal', 'conflictSummary', 'eventSummary', 'stateNote'], ['resourceState', 'internalState', 'publicReputation', 'conflictSummary', 'eventSummary', 'stateNote']), numberFields: ['orderIndex'], defaults: { orderIndex: 0 } },
    { kind: 'factionMemberships', title: '势力成员', addLabel: '新增成员', parentIdName: 'factionId', titleField: 'characterId', metaFields: ['roleTitle', 'rank'], fields: subFields(['characterId', 'membershipType', 'roleTitle', 'rank', 'department', 'isCurrent', 'isPublic', 'startsAt', 'endsAt', 'notes'], ['notes']), requiredFields: ['characterId'], booleanFields: ['isCurrent', 'isPublic'], defaults: { isCurrent: true, isPublic: true } },
    { kind: 'factionRelations', title: '势力关系', addLabel: '新增关系', parentIdName: 'sourceFactionId', titleField: 'targetFactionId', metaFields: ['relationType', 'strength'], fields: subFields(['targetFactionId', 'relationType', 'direction', 'strength', 'isCurrent', 'startsAt', 'endsAt', 'description'], ['description']), requiredFields: ['targetFactionId'], booleanFields: ['isCurrent'], defaults: { isCurrent: true } },
    { kind: 'factionRules', title: '势力规则', addLabel: '关联规则', parentIdName: 'factionId', titleField: 'worldRuleId', metaFields: ['relationType', 'enforcementLevel'], fields: ruleRelationFields, requiredFields: ['worldRuleId'], booleanFields: ['isPrimary'], numberFields: ['orderIndex'], defaults: { isPrimary: false, orderIndex: 0 } },
  ],
  species: [
    { kind: 'speciesTraits', title: '物种特征', addLabel: '新增特征', parentIdName: 'speciesId', titleField: 'name', metaFields: ['traitType', 'importance'], fields: subFields(['name', 'traitType', 'summary', 'description', 'isInheritable', 'isCommon', 'importance'], ['summary', 'description']), requiredFields: ['name'], booleanFields: ['isInheritable', 'isCommon'], numberFields: ['importance'], defaults: { isInheritable: false, isCommon: true, importance: 0 } },
    { kind: 'speciesAbilities', title: '物种能力', addLabel: '新增能力', parentIdName: 'speciesId', titleField: 'name', metaFields: ['abilityType', 'importance'], fields: subFields(['name', 'abilityType', 'summary', 'description', 'effect', 'cost', 'limitation', 'condition', 'inheritanceType', 'awakeningCondition', 'masteryNotes', 'isCommon', 'isInheritable', 'isUnique', 'visibility', 'importance'], ['summary', 'description', 'effect', 'cost', 'limitation', 'condition', 'awakeningCondition', 'masteryNotes']), requiredFields: ['name'], booleanFields: ['isCommon', 'isInheritable', 'isUnique'], numberFields: ['importance'], defaults: { isCommon: true, isInheritable: false, isUnique: false, importance: 0 } },
    { kind: 'speciesRules', title: '物种规则', addLabel: '关联规则', parentIdName: 'speciesId', titleField: 'worldRuleId', metaFields: ['relationType', 'enforcementLevel'], fields: ruleRelationFields, requiredFields: ['worldRuleId'], booleanFields: ['isPrimary'], numberFields: ['orderIndex'], defaults: { isPrimary: false, orderIndex: 0 } },
  ],
  storyItems: [
    { kind: 'storyItemStates', title: '道具状态', addLabel: '新增状态', parentIdName: 'storyItemId', titleField: 'stage', metaFields: ['owner', 'location'], fields: subFields(['stage', 'orderIndex', 'chapterId', 'owner', 'location', 'lifecycleStatus', 'visibility', 'condition', 'powerState', 'eventSummary', 'stateNote'], ['condition', 'powerState', 'eventSummary', 'stateNote']), numberFields: ['orderIndex'], defaults: { orderIndex: 0 } },
    { kind: 'storyItemRules', title: '道具规则', addLabel: '关联规则', parentIdName: 'storyItemId', titleField: 'worldRuleId', metaFields: ['relationType', 'enforcementLevel'], fields: ruleRelationFields, requiredFields: ['worldRuleId'], booleanFields: ['isPrimary'], numberFields: ['orderIndex'], defaults: { isPrimary: false, orderIndex: 0 } },
  ],
  abilities: [
    { kind: 'abilityRules', title: '能力规则', addLabel: '关联规则', parentIdName: 'abilityId', titleField: 'worldRuleId', metaFields: ['relationType', 'enforcementLevel'], fields: ruleRelationFields, requiredFields: ['worldRuleId'], booleanFields: ['isPrimary'], numberFields: ['orderIndex'], defaults: { isPrimary: false, orderIndex: 0 } },
  ],
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
  return fieldKey === 'relationshipMap' || fieldKey === 'relatedRules' || fieldKey === 'members' || fieldKey === 'locations' || fieldKey === 'traits' || fieldKey === 'abilities' || fieldKey.startsWith('related');
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


function storyItemToRecord(storyItem: StoryItem, profile?: StoryItemProfile): EntityRecord {
  const latestState = profile?.latestState;
  return {
    id: storyItem.id,
    name: storyItem.name,
    summary: storyItem.summary || storyItem.description || storyItem.narrativeRole,
    type: storyItem.itemType,
    status: String(latestState?.lifecycleStatus ?? storyItem.lifecycleStatus ?? storyItem.canonStatus),
    importance: storyItem.importance,
    updatedAt: storyItem.updatedAt,
    fields: {
      name: storyItem.name,
      itemType: storyItem.itemType,
      narrativeRole: storyItem.narrativeRole,
      summary: storyItem.summary,
      description: storyItem.description,
      origin: storyItem.origin,
      appearance: storyItem.appearance,
      function: storyItem.function,
      effect: storyItem.effect,
      cost: storyItem.cost,
      limitation: storyItem.limitation,
      owner: latestState?.owner ?? storyItem.owner,
      location: latestState?.location ?? storyItem.location,
      lifecycleStatus: latestState?.lifecycleStatus ?? storyItem.lifecycleStatus,
      visibility: latestState?.visibility ?? storyItem.visibility,
      relatedRules: compactRelationList(profile?.rules),
      notes: latestState?.stateNote,
      importance: storyItem.importance,
    },
  };
}

function abilityToRecord(ability: Ability, profile?: AbilityProfile): EntityRecord {
  return {
    id: ability.id,
    name: ability.name,
    summary: ability.summary || ability.description || ability.effect,
    type: ability.abilityType,
    status: ability.visibility || ability.canonStatus,
    importance: ability.importance,
    updatedAt: ability.updatedAt,
    fields: {
      name: ability.name,
      abilityType: ability.abilityType,
      narrativeRole: ability.narrativeRole,
      summary: ability.summary,
      description: ability.description,
      condition: ability.condition,
      effect: ability.effect,
      cost: ability.cost,
      limitation: ability.limitation,
      source: ability.source,
      progression: ability.progression,
      masteryNotes: ability.masteryNotes,
      countermeasure: ability.countermeasure,
      visibility: ability.visibility,
      relatedRules: compactRelationList(profile?.rules),
      notes: undefined,
      importance: ability.importance,
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

function worldItemToRecord(worldItem: WorldItem): EntityRecord {
  return {
    id: worldItem.id,
    name: worldItem.name,
    summary: worldItem.summary || worldItem.content || worldItem.type,
    type: worldItem.type,
    status: worldItem.visibility || worldItem.canonStatus,
    importance: worldItem.importance,
    updatedAt: worldItem.updatedAt,
    fields: {
      name: worldItem.name,
      type: worldItem.type,
      summary: worldItem.summary,
      content: worldItem.content,
      tags: worldItem.tags?.join('、'),
      visibility: worldItem.visibility,
      importance: worldItem.importance,
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

function isPersistedEntityId(id: string | undefined): id is string {
  if (!id?.trim()) return false;
  const normalizedId = id.trim();
  return !localEntityIdPrefixes.some((prefix) => normalizedId.startsWith(prefix));
}

function persistedItemsFromResponse<T extends { id?: string }>(response: unknown): T[] {
  return itemsFromResponse<T>(response).filter((item) => isPersistedEntityId(item.id));
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
  const withoutDraft = current.filter((item) => isPersistedEntityId(item.id));
  return withoutDraft.some((item) => item.id === saved.id)
    ? withoutDraft.map((item) => (item.id === saved.id ? saved : item))
    : [saved, ...withoutDraft];
}

function draftRecord(config: ModuleConfig): EntityRecord {
  const nameKey = config.kind === 'rules' ? 'title' : 'name';
  const displayName = config.kind === 'rules' ? t('common.untitledRule') : t('common.newItem');
  const defaults = config.kind === 'worldItems' ? { type: 'custom' } : {};
  return record(`local-${Date.now()}`, displayName, '', config.title, '', 0, { [nameKey]: undefined, ...defaults });
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


function recordToStoryItemInput(values: Record<string, unknown>): StoryItemInput {
  return {
    name: asOptionalString(values.name),
    itemType: asOptionalString(values.itemType),
    narrativeRole: asOptionalString(values.narrativeRole),
    summary: asOptionalString(values.summary),
    description: asOptionalString(values.description),
    origin: asOptionalString(values.origin),
    appearance: asOptionalString(values.appearance),
    function: asOptionalString(values.function),
    effect: asOptionalString(values.effect),
    cost: asOptionalString(values.cost),
    limitation: asOptionalString(values.limitation),
    owner: asOptionalString(values.owner),
    location: asOptionalString(values.location),
    lifecycleStatus: asOptionalString(values.lifecycleStatus),
    visibility: asOptionalString(values.visibility),
    importance: numberInput(values.importance),
  };
}

function recordToAbilityInput(values: Record<string, unknown>): AbilityInput {
  return {
    name: asOptionalString(values.name),
    abilityType: asOptionalString(values.abilityType),
    narrativeRole: asOptionalString(values.narrativeRole),
    summary: asOptionalString(values.summary),
    description: asOptionalString(values.description),
    condition: asOptionalString(values.condition),
    effect: asOptionalString(values.effect),
    cost: asOptionalString(values.cost),
    limitation: asOptionalString(values.limitation),
    source: asOptionalString(values.source),
    progression: asOptionalString(values.progression),
    masteryNotes: asOptionalString(values.masteryNotes),
    countermeasure: asOptionalString(values.countermeasure),
    visibility: asOptionalString(values.visibility),
    importance: numberInput(values.importance),
  };
}

function recordToWorldItemInput(values: Record<string, unknown>, existingType?: unknown): WorldItemInput {
  const type = asOptionalString(values.type);
  const currentType = asOptionalString(existingType);
  const safeType = type && allowedWorldItemTypes.has(type) ? type : (type === currentType ? undefined : 'custom');
  return {
    name: asOptionalString(values.name),
    type: safeType,
    summary: asOptionalString(values.summary),
    content: asOptionalString(values.content),
    tags: parseTags(values.tags),
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

function parseSubResourceInput(values: Record<string, unknown>, config: SubResourceConfig) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    const value = values[field.key];
    if (value === '' || value === undefined || value === null) return acc;
    if (config.numberFields?.includes(field.key)) acc[field.key] = numberInput(value);
    else if (config.booleanFields?.includes(field.key)) acc[field.key] = Boolean(value);
    else acc[field.key] = value;
    return acc;
  }, {});
}

function subResourceToRecord(item: Record<string, unknown>, config: SubResourceConfig): SubResourceRecord {
  const titleValue = compactText(item[config.titleField]);
  const title = titleValue === t('common.notFilled') ? config.title : titleValue;
  const meta = config.metaFields.map((key) => item[key]).filter((value) => !isEmptyDisplayValue(value)).map(compactText).join(' · ');
  const summary = config.fields.find((field) => field.long && !isEmptyDisplayValue(item[field.key]))?.key;
  return { id: String(item.id), title, meta, summary: summary ? compactText(item[summary]) : undefined, updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined, fields: { ...item } };
}

async function listSubResources(projectId: string, parentId: string, config: SubResourceConfig): Promise<SubResourceRecord[]> {
  let response: unknown[];
  switch (config.kind) {
    case 'characterStates': response = await listCharacterStates(projectId, parentId); break;
    case 'characterIdentities': response = await listCharacterIdentities(projectId, parentId); break;
    case 'locationStates': response = await listLocationStates(projectId, parentId); break;
    case 'locationRules': response = await listLocationRules(projectId, parentId); break;
    case 'locationFactions': response = await listLocationFactions(projectId, parentId); break;
    case 'factionStates': response = await listFactionStates(projectId, parentId); break;
    case 'factionMemberships': response = await listFactionMemberships(projectId, parentId); break;
    case 'factionRelations': response = await listFactionRelations(projectId, parentId); break;
    case 'factionRules': response = await listFactionRules(projectId, parentId); break;
    case 'speciesTraits': response = await listSpeciesTraits(projectId, parentId); break;
    case 'speciesAbilities': response = await listSpeciesAbilities(projectId, parentId); break;
    case 'speciesRules': response = await listSpeciesRules(projectId, parentId); break;
    case 'storyItemStates': response = await listStoryItemStates(projectId, parentId); break;
    case 'storyItemRules': response = await listStoryItemRules(projectId, parentId); break;
    case 'abilityRules': response = await listAbilityRules(projectId, parentId); break;
  }
  return response.filter((item) => isPersistedEntityId((item as Record<string, unknown>).id as string | undefined)).map((item) => subResourceToRecord(item as Record<string, unknown>, config));
}

async function saveSubResource(projectId: string, parentId: string, config: SubResourceConfig, selected: SubResourceRecord | undefined, values: Record<string, unknown>): Promise<SubResourceRecord> {
  const input = parseSubResourceInput(values, config);
  const isNew = !selected || !isPersistedEntityId(selected.id);
  let saved: unknown;
  switch (config.kind) {
    case 'characterStates': saved = isNew ? await createCharacterState(projectId, parentId, input as CharacterStateInput) : await updateCharacterState(projectId, parentId, selected.id, input as CharacterStateInput); break;
    case 'characterIdentities': saved = isNew ? await createCharacterIdentity(projectId, parentId, input as CharacterIdentityInput) : await updateCharacterIdentity(projectId, parentId, selected.id, input as CharacterIdentityInput); break;
    case 'locationStates': saved = isNew ? await createLocationState(projectId, parentId, input as LocationStateInput) : await updateLocationState(projectId, parentId, selected.id, input as LocationStateInput); break;
    case 'locationRules': saved = isNew ? await createLocationRule(projectId, parentId, input as LocationRuleInput) : await updateLocationRule(projectId, parentId, selected.id, input as LocationRuleInput); break;
    case 'locationFactions': saved = isNew ? await createLocationFaction(projectId, parentId, input as LocationFactionInput) : await updateLocationFaction(projectId, parentId, selected.id, input as LocationFactionInput); break;
    case 'factionStates': saved = isNew ? await createFactionState(projectId, parentId, input as FactionStateInput) : await updateFactionState(projectId, parentId, selected.id, input as FactionStateInput); break;
    case 'factionMemberships': saved = isNew ? await createFactionMembership(projectId, parentId, input as FactionMembershipInput) : await updateFactionMembership(projectId, parentId, selected.id, input as FactionMembershipInput); break;
    case 'factionRelations': saved = isNew ? await createFactionRelation(projectId, parentId, input as FactionRelationInput) : await updateFactionRelation(projectId, parentId, selected.id, input as FactionRelationInput); break;
    case 'factionRules': saved = isNew ? await createFactionRule(projectId, parentId, input as FactionRuleInput) : await updateFactionRule(projectId, parentId, selected.id, input as FactionRuleInput); break;
    case 'speciesTraits': saved = isNew ? await createSpeciesTrait(projectId, parentId, input as SpeciesTraitInput) : await updateSpeciesTrait(projectId, parentId, selected.id, input as SpeciesTraitInput); break;
    case 'speciesAbilities': saved = isNew ? await createSpeciesAbility(projectId, parentId, input as SpeciesAbilityInput) : await updateSpeciesAbility(projectId, parentId, selected.id, input as SpeciesAbilityInput); break;
    case 'speciesRules': saved = isNew ? await createSpeciesRule(projectId, parentId, input as SpeciesRuleInput) : await updateSpeciesRule(projectId, parentId, selected.id, input as SpeciesRuleInput); break;
    case 'storyItemStates': saved = isNew ? await createStoryItemState(projectId, parentId, input as StoryItemStateInput) : await updateStoryItemState(projectId, parentId, selected.id, input as StoryItemStateInput); break;
    case 'storyItemRules': saved = isNew ? await createStoryItemRule(projectId, parentId, input as StoryItemRuleInput) : await updateStoryItemRule(projectId, parentId, selected.id, input as StoryItemRuleInput); break;
    case 'abilityRules': saved = isNew ? await createAbilityRule(projectId, parentId, input as AbilityRuleInput) : await updateAbilityRule(projectId, parentId, selected.id, input as AbilityRuleInput); break;
  }
  const savedRecord = saved as Record<string, unknown>;
  if (!isPersistedEntityId(savedRecord.id as string | undefined)) {
    return { id: String(savedRecord.id ?? `local-${Date.now()}`), title: config.title, fields: { ...savedRecord } };
  }
  return subResourceToRecord(savedRecord, config);
}

async function deleteSubResource(projectId: string, parentId: string, config: SubResourceConfig, id: string) {
  switch (config.kind) {
    case 'characterStates': return deleteCharacterState(projectId, parentId, id);
    case 'characterIdentities': return deleteCharacterIdentity(projectId, parentId, id);
    case 'locationStates': return deleteLocationState(projectId, parentId, id);
    case 'locationRules': return deleteLocationRule(projectId, parentId, id);
    case 'locationFactions': return deleteLocationFaction(projectId, parentId, id);
    case 'factionStates': return deleteFactionState(projectId, parentId, id);
    case 'factionMemberships': return deleteFactionMembership(projectId, parentId, id);
    case 'factionRelations': return deleteFactionRelation(projectId, parentId, id);
    case 'factionRules': return deleteFactionRule(projectId, parentId, id);
    case 'speciesTraits': return deleteSpeciesTrait(projectId, parentId, id);
    case 'speciesAbilities': return deleteSpeciesAbility(projectId, parentId, id);
    case 'speciesRules': return deleteSpeciesRule(projectId, parentId, id);
    case 'storyItemStates': return deleteStoryItemState(projectId, parentId, id);
    case 'storyItemRules': return deleteStoryItemRule(projectId, parentId, id);
    case 'abilityRules': return deleteAbilityRule(projectId, parentId, id);
  }
}

function parseTags(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
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
          {activeSection === 'info' ? <ProjectInfoPanel project={project} onSave={(input) => onProjectUpdate(project.id, input)} onDelete={onDelete} /> : activeSection === 'assets' ? <AssetsModule projectId={project.id} /> : <EntityModule key={`${project.id}:${activeSection}`} projectId={project.id} config={moduleConfigs[activeSection]} />}
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
      return persistedItemsFromResponse<Character>(await listCharacters(projectId)).map(characterToRecord);
    case 'locations':
      return persistedItemsFromResponse<Location>(await listLocations(projectId)).map((location) => locationToRecord(location));
    case 'factions': {
      const response = await listFactions(projectId);
      const items = persistedItemsFromResponse<Faction>(response);
      return items.map((faction) => factionToRecord(faction));
    }
    case 'species':
      return persistedItemsFromResponse<Species>(await listSpecies(projectId)).map((species) => speciesToRecord(species));
    case 'storyItems':
      return persistedItemsFromResponse<StoryItem>(await listStoryItems(projectId)).map((item) => storyItemToRecord(item));
    case 'abilities':
      return persistedItemsFromResponse<Ability>(await listAbilities(projectId)).map((ability) => abilityToRecord(ability));
    case 'rules':
      return persistedItemsFromResponse<WorldRule>(await listWorldRules(projectId)).map((rule) => worldRuleToRecord(rule));
    case 'worldItems':
      return persistedItemsFromResponse<WorldItem>(await listWorldItems(projectId)).map((item) => worldItemToRecord(item));
  }
}

async function loadEntityProfileRecord(projectId: string, kind: ModuleKind, entityId: string): Promise<EntityRecord | undefined> {
  if (!isPersistedEntityId(entityId)) return undefined;
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
    case 'storyItems': {
      const profile = await getStoryItemProfile(projectId, entityId);
      return storyItemToRecord(profile.storyItem, profile);
    }
    case 'abilities': {
      const profile = await getAbilityProfile(projectId, entityId);
      return abilityToRecord(profile.ability, profile);
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
  const isNew = !isPersistedEntityId(selected.id);
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
    case 'storyItems': {
      const input = recordToStoryItemInput(values);
      return storyItemToRecord(isNew ? await createStoryItem(projectId, input) : await updateStoryItem(projectId, selected.id, input));
    }
    case 'abilities': {
      const input = recordToAbilityInput(values);
      return abilityToRecord(isNew ? await createAbility(projectId, input) : await updateAbility(projectId, selected.id, input));
    }
    case 'rules': {
      const input = recordToWorldRuleInput(values);
      return worldRuleToRecord(isNew ? await createWorldRule(projectId, input) : await updateWorldRule(projectId, selected.id, input));
    }
    case 'worldItems': {
      const input = recordToWorldItemInput(values, selected.fields.type);
      return worldItemToRecord(isNew ? await createWorldItem(projectId, input) : await updateWorldItem(projectId, selected.id, input));
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
    case 'storyItems':
      await deleteStoryItem(projectId, entityId);
      return;
    case 'abilities':
      await deleteAbility(projectId, entityId);
      return;
    case 'rules':
      await deleteWorldRule(projectId, entityId);
      return;
    case 'worldItems':
      await deleteWorldItem(projectId, entityId);
      return;
  }
}


function AssetsModule({ projectId }: { projectId: string }) {
  const [kind, setKind] = useState<'storyItems' | 'abilities'>('storyItems');
  return <div><Card style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: 12 }}><Space><Button theme={kind === 'storyItems' ? 'solid' : 'light'} type={kind === 'storyItems' ? 'primary' : 'tertiary'} onClick={() => setKind('storyItems')}>{t('modules.storyItems.switchLabel')}</Button><Button theme={kind === 'abilities' ? 'solid' : 'light'} type={kind === 'abilities' ? 'primary' : 'tertiary'} onClick={() => setKind('abilities')}>{t('modules.abilities.switchLabel')}</Button></Space></Card><EntityModule key={`${projectId}:${kind}`} projectId={projectId} config={moduleConfigs[kind]} /></div>;
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
    if (!isPersistedEntityId(selectedId)) return;
    let cancelled = false;
    loadEntityProfileRecord(projectId, config.kind, selectedId)
      .then((profileRecord) => {
        if (!cancelled && profileRecord) {
          setRecords((current) => current.map((item) => (item.id === selectedId ? profileRecord : item)));
          setLoadError(undefined);
        }
      })
      .catch(() => {
        // Profile enrichment is an automatic background load. Keep the base list usable
        // and avoid surfacing transient/stale-id failures as module load errors.
      });
    return () => {
      cancelled = true;
    };
  }, [config.kind, projectId, selectedId]);

  const selected = selectedId ? records.find((recordItem) => recordItem.id === selectedId) : undefined;
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
    setRecords((current) => [fresh, ...current.filter((item) => isPersistedEntityId(item.id))]);
    setSelectedId(fresh.id);
    setEditing(true);
  }

  function handleCancelEdit() {
    if (selected && !isPersistedEntityId(selected.id)) {
      const nextRecords = records.filter((item) => item.id !== selected.id);
      setRecords(nextRecords);
      setSelectedId(nextRecords[0]?.id);
    }
    setEditing(false);
  }

  function handleSelectRecord(recordId: string) {
    setRecords((current) => current.filter((item) => isPersistedEntityId(item.id) || item.id === recordId));
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
      if (isPersistedEntityId(selected.id)) {
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
        {!selected ? detailEmpty : <><div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}><div><Title heading={4} style={{ margin: 0 }}>{selected.name}</Title><Text type="tertiary">{selected.updatedAt ? formatDate(selected.updatedAt) : config.metaFallback}</Text></div>{editing ? <Space><Button onClick={handleCancelEdit}>{t('actions.cancel')}</Button><Button theme="solid" type="primary" loading={saving} onClick={handleSave}>{t('actions.save')}</Button></Space> : <Space><Button icon={<IconEdit />} onClick={() => setEditing(true)}>{t('actions.edit')}</Button><Popconfirm title={t('modules.deleteTitle')} content={t('modules.deleteContent')} onConfirm={handleDelete}><Button icon={<IconDelete />} type="danger" theme="borderless">{t('actions.delete')}</Button></Popconfirm></Space>}</div>{editing ? <Form key={selected.id} initValues={selected.fields} getFormApi={setFormApi} labelPosition="top"><GroupedForm groups={config.groups} nameLabel={config.nameLabel} namePlaceholder={config.namePlaceholder} /></Form> : <><GroupedDetails groups={config.groups} values={selected.fields} /><SubResourceSections projectId={projectId} parentId={selected.id} configs={subResourceConfigs[config.kind] ?? []} /><RelationshipsSection projectId={projectId} entityType={moduleEntityType[config.kind]} entityId={selected.id} entityName={selected.name} /></>}</>}
      </Card>
    </div>
  </ModuleShell>;
}

function SubResourceSections({ projectId, parentId, configs }: { projectId: string; parentId: string; configs: SubResourceConfig[] }) {
  if (!isPersistedEntityId(parentId) || configs.length === 0) return null;
  return <div style={{ display: 'grid', gap: 16 }}>{configs.map((config) => <SubResourceSection key={config.kind} projectId={projectId} parentId={parentId} config={config} />)}</div>;
}

function SubResourceSection({ projectId, parentId, config }: { projectId: string; parentId: string; config: SubResourceConfig }) {
  const [items, setItems] = useState<SubResourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<SubResourceRecord>();
  const [formApi, setFormApi] = useState<FormApi>();

  const refresh = useCallback(async () => {
    if (!isPersistedEntityId(parentId)) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const next = await listSubResources(projectId, parentId, config);
      setItems(next);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [config, parentId, projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreate() {
    setEditingItem({ id: `local-${Date.now()}`, title: config.title, fields: { ...(config.defaults ?? {}) } });
    setSheetVisible(true);
  }

  function openEdit(item: SubResourceRecord) {
    setEditingItem(item);
    setSheetVisible(true);
  }

  function closeSheet() {
    setSheetVisible(false);
    setEditingItem(undefined);
  }

  async function handleSave() {
    if (!formApi) return;
    const values = await formApi.validate() as Record<string, unknown>;
    setSaving(true);
    try {
      const saved = await saveSubResource(projectId, parentId, config, editingItem, values);
      setItems((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      Notification.success({ title: t('messages.saveSuccess') });
      closeSheet();
      refresh();
    } catch (error) {
      Notification.error({ title: t('messages.updateFailed'), content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: SubResourceRecord) {
    try {
      await deleteSubResource(projectId, parentId, config, item.id);
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      Notification.success({ title: t('messages.deleteSuccess') });
    } catch (error) {
      Notification.error({ title: t('messages.deleteFailed'), content: String((error as Error).message ?? error) });
    }
  }

  return <section style={{ width: '100%', padding: '2px 0 14px', borderBottom: '1px solid var(--semi-color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <Title heading={5} style={{ margin: 0 }}>{config.title}</Title>
      <Button size="small" theme="light" type="primary" icon={<IconPlus />} onClick={openCreate}>{config.addLabel}</Button>
    </div>
    {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={3} />} loading /> : items.length === 0 ? <Text type="tertiary">暂无{config.title}</Text> : <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item) => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'start', padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 10, background: 'var(--semi-color-bg-0)' }}>
        <div style={{ minWidth: 0 }}>
          <Space wrap spacing={6} style={{ rowGap: 6 }}>
            <Text strong>{item.title}</Text>
            {item.meta ? <Tag size="small">{item.meta}</Tag> : null}
            {item.updatedAt ? <Tag size="small">{formatDate(item.updatedAt)}</Tag> : null}
          </Space>
          {item.summary ? <Paragraph ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{item.summary}</Paragraph> : null}
        </div>
        <Space>
          <Button icon={<IconEdit />} theme="borderless" onClick={() => openEdit(item)} />
          <Popconfirm title={t('modules.deleteTitle')} content={t('modules.deleteContent')} onConfirm={() => handleDelete(item)}><Button icon={<IconDelete />} type="danger" theme="borderless" /></Popconfirm>
        </Space>
      </div>)}
    </div>}
    <SideSheet title={editingItem?.id.startsWith('local-') ? config.addLabel : `编辑${config.title}`} visible={sheetVisible} onCancel={closeSheet} width={560} footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={closeSheet}>{t('actions.cancel')}</Button><Button theme="solid" type="primary" loading={saving} onClick={handleSave}>{t('actions.save')}</Button></div>}>
      {editingItem ? <Form key={editingItem.id} initValues={editingItem.fields} getFormApi={setFormApi} labelPosition="top"><SubResourceForm config={config} /></Form> : null}
    </SideSheet>
  </section>;
}

function SubResourceForm({ config }: { config: SubResourceConfig }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
    {config.fields.map((field) => {
      const rules = config.requiredFields?.includes(field.key) ? [{ required: true, message: `请填写${field.label}` }] : undefined;
      if (config.booleanFields?.includes(field.key)) return <Form.Switch key={field.key} field={field.key} label={field.label} />;
      if (config.numberFields?.includes(field.key)) return <Form.InputNumber key={field.key} field={field.key} label={field.label} style={{ width: '100%' }} rules={rules} />;
      if (field.long || config.longFields?.includes(field.key)) return <Form.TextArea key={field.key} field={field.key} label={field.label} autosize={{ minRows: 3, maxRows: 8 }} style={{ gridColumn: '1 / -1' }} rules={rules} />;
      return <Form.Input key={field.key} field={field.key} label={field.label} rules={rules} />;
    })}
  </div>;
}

function RelationshipsSection({ projectId, entityType, entityId, entityName }: { projectId: string; entityType: RelationshipTargetType; entityId: string; entityName: string }) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [targetOptions, setTargetOptions] = useState<RelationshipTargetOption[]>([]);
  const [targetType, setTargetType] = useState<RelationshipTargetType>('character');
  const [targetId, setTargetId] = useState<string>();
  const [relationType, setRelationType] = useState('related_to');
  const [direction, setDirection] = useState<'directed' | 'bidirectional'>('directed');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<number>(0);
  const [strength, setStrength] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const refreshRelationships = useCallback(async () => {
    if (!isPersistedEntityId(entityId)) {
      setRelationships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await listRelationships(projectId, { entityType, entityId, pageSize: 100 });
      setRelationships(response.items.filter((relationship) => isPersistedEntityId(relationship.sourceId) && isPersistedEntityId(relationship.targetId)));
    } catch {
      setRelationships([]);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, projectId]);

  useEffect(() => {
    if (!isPersistedEntityId(entityId)) {
      setTargetOptions([]);
      setTargetId(undefined);
      return;
    }
    let cancelled = false;
    loadRelationshipTargetOptions(projectId)
      .then((options) => {
        if (cancelled) return;
        setTargetOptions(options);
        const first = options.find((option) => !(option.type === entityType && option.id === entityId));
        setTargetType(first?.type ?? 'character');
        setTargetId(first?.id);
      })
      .catch(() => {
        if (cancelled) return;
        setTargetOptions([]);
        setTargetId(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, projectId]);

  useEffect(() => {
    refreshRelationships();
  }, [refreshRelationships]);

  const selectableTargets = targetOptions.filter((option) => option.type === targetType && !(option.type === entityType && option.id === entityId));
  const optionByKey = new Map(targetOptions.map((option) => [`${option.type}:${option.id}`, option]));

  function handleTargetTypeChange(nextType: RelationshipTargetType) {
    setTargetType(nextType);
    const first = targetOptions.find((option) => option.type === nextType && !(option.type === entityType && option.id === entityId));
    setTargetId(first?.id);
  }

  async function handleCreateRelationship() {
    if (!isPersistedEntityId(entityId) || !isPersistedEntityId(targetId) || !relationType.trim()) {
      Notification.error({ title: t('messages.createFailed'), content: '请选择目标对象并填写关系类型' });
      return;
    }
    setSaving(true);
    try {
      const input: RelationshipInput = {
        sourceType: entityType,
        sourceId: entityId,
        targetType,
        targetId,
        relationType: relationType.trim(),
        direction,
        description: description.trim() || undefined,
        importance,
        strength,
      };
      await createRelationship(projectId, input);
      setDescription('');
      setRelationType('related_to');
      setDirection('directed');
      setImportance(0);
      setStrength(0);
      await refreshRelationships();
      Notification.success({ title: t('messages.saveSuccess') });
    } catch (error) {
      Notification.error({ title: t('messages.createFailed'), content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRelationship(relationshipId: string) {
    try {
      await deleteRelationship(projectId, relationshipId);
      setRelationships((current) => current.filter((relationship) => relationship.id !== relationshipId));
      Notification.success({ title: t('messages.deleteSuccess') });
    } catch (error) {
      Notification.error({ title: t('messages.deleteFailed'), content: String((error as Error).message ?? error) });
    }
  }

  return <section style={{ width: '100%', padding: '2px 0 14px', borderBottom: '1px solid var(--semi-color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <Title heading={5} style={{ margin: 0 }}>关系</Title>
      <Text type="tertiary" size="small">{entityName}</Text>
    </div>
    <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
      {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={3} />} loading /> : relationships.length === 0 ? <Text type="tertiary">暂无关系</Text> : relationships.map((relationship) => {
        const sourceIsCurrent = relationship.sourceType === entityType && relationship.sourceId === entityId;
        const otherType = sourceIsCurrent ? relationship.targetType : relationship.sourceType;
        const otherId = sourceIsCurrent ? relationship.targetId : relationship.sourceId;
        const other = optionByKey.get(`${otherType}:${otherId}`);
        const connector = relationship.direction === 'bidirectional' ? '↔' : (sourceIsCurrent ? '→' : '←');
        return <div key={relationship.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'start', padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 10, background: 'var(--semi-color-bg-0)' }}>
          <div style={{ minWidth: 0 }}>
            <Space wrap spacing={6} style={{ rowGap: 6 }}>
              <Tag color="blue" size="small">{relationship.relationType}</Tag>
              <Tag size="small">{connector}</Tag>
              <Tag size="small">{entityTypeLabel(otherType)}：{other?.label ?? otherId}</Tag>
              <Tag size="small">重要度 {relationship.importance ?? 0}</Tag>
              {relationship.strength !== null && relationship.strength !== undefined ? <Tag size="small">强度 {relationship.strength}</Tag> : null}
              {relationship.canonStatus ? <Tag size="small" color={relationship.canonStatus === 'confirmed' ? 'green' : undefined}>{relationship.canonStatus}</Tag> : null}
            </Space>
            {relationship.description ? <Paragraph style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{relationship.description}</Paragraph> : null}
          </div>
          <Popconfirm title={t('modules.deleteTitle')} content={t('modules.deleteContent')} onConfirm={() => handleDeleteRelationship(relationship.id)}>
            <Button icon={<IconDelete />} type="danger" theme="borderless" />
          </Popconfirm>
        </div>;
      })}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(180px,1fr) minmax(160px,1fr) 130px', gap: 10, alignItems: 'start' }}>
      <Select value={targetType} onChange={(value) => handleTargetTypeChange(value as RelationshipTargetType)} style={{ width: '100%' }}>{relationshipTargetTypes.map((type) => <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>)}</Select>
      <Select value={targetId} placeholder="选择目标对象" onChange={(value) => setTargetId(value as string)} style={{ width: '100%' }}>{selectableTargets.map((option) => <Select.Option key={option.id} value={option.id}>{option.label}</Select.Option>)}</Select>
      <Input value={relationType} onChange={setRelationType} placeholder="relation_type" />
      <Select value={direction} onChange={(value) => setDirection(value as 'directed' | 'bidirectional')} style={{ width: '100%' }}><Select.Option value="directed">directed</Select.Option><Select.Option value="bidirectional">bidirectional</Select.Option></Select>
      <Input value={description} onChange={setDescription} placeholder="关系说明" style={{ gridColumn: '1 / 3' }} />
      <Input value={String(importance)} onChange={(value) => setImportance(Math.max(0, Number(value) || 0))} placeholder="重要度" />
      <Input value={String(strength)} onChange={(value) => setStrength(Math.max(0, Number(value) || 0))} placeholder="强度" />
      <Space wrap spacing={6} style={{ gridColumn: '1 / -1', rowGap: 6 }}>
        {relationshipTypeOptions.map((type) => <Button key={type} size="small" theme={relationType === type ? 'solid' : 'light'} type={relationType === type ? 'primary' : 'tertiary'} onClick={() => setRelationType(type)}>{type}</Button>)}
        <Button size="small" theme="solid" type="primary" loading={saving} disabled={!targetId} onClick={handleCreateRelationship}>{t('actions.add')}</Button>
      </Space>
    </div>
  </section>;
}

function entityTypeLabel(type: RelationshipEntityType) {
  return relationshipTargetTypes.find((item) => item.value === type)?.label ?? type;
}

async function loadRelationshipTargetOptions(projectId: string): Promise<RelationshipTargetOption[]> {
  const [characters, locations, factions, species, storyItems, abilities, worldRules, worldItems] = await Promise.all([
    listCharacters(projectId),
    listLocations(projectId),
    listFactions(projectId),
    listSpecies(projectId),
    listStoryItems(projectId),
    listAbilities(projectId),
    listWorldRules(projectId),
    listWorldItems(projectId),
  ]);
  return [
    ...persistedItemsFromResponse<Character>(characters).map((item) => targetOption('character', item.id, item.name, item.background || item.role)),
    ...persistedItemsFromResponse<Location>(locations).map((item) => targetOption('location', item.id, item.name, item.summary || item.locationType)),
    ...persistedItemsFromResponse<Faction>(factions).map((item) => targetOption('faction', item.id, item.name, item.summary || item.factionType)),
    ...persistedItemsFromResponse<Species>(species).map((item) => targetOption('species', item.id, item.name, item.summary || item.speciesType)),
    ...persistedItemsFromResponse<StoryItem>(storyItems).map((item) => targetOption('story_item', item.id, item.name, item.summary || item.itemType)),
    ...persistedItemsFromResponse<Ability>(abilities).map((item) => targetOption('ability', item.id, item.name, item.summary || item.abilityType)),
    ...persistedItemsFromResponse<WorldRule>(worldRules).map((item) => targetOption('world_rule', item.id, item.title, item.summary || item.ruleType)),
    ...persistedItemsFromResponse<WorldItem>(worldItems).map((item) => targetOption('world_item', item.id, item.name, item.summary || item.type)),
  ];
}

function targetOption(type: RelationshipTargetType, id: string, label: string, summary?: string | null): RelationshipTargetOption {
  return { type, id, label, summary: summary ?? undefined };
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
    if (field.options) return <Form.Select key={field.key} field={field.key} label={label} placeholder={placeholder} rules={rules} style={{ width: '100%' }}>{field.options.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>;
    if (field.key === 'importance' || field.key === 'estimatedChapters' || field.key === 'wordsPerChapter') return <Form.InputNumber key={field.key} field={field.key} label={label} style={{ width: '100%' }} />;
    return <Form.Input key={field.key} field={field.key} label={label} placeholder={placeholder} rules={rules} />;
  })}</div></section>)}</Space>;
}

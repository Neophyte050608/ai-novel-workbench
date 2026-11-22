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
import { StatusTag, statusLabel, statusOptions, statusColor } from '../../shared/ui/StatusTag';
import { listChapters } from '../chapters/api';
import type { Chapter } from '../chapters/types';
import { ChapterWorkspace } from '../chapters/ChapterWorkspace';
import { PlanningWorkspace } from '../planning/PlanningWorkspace';
import { SceneWorkspace } from '../scenes/SceneWorkspace';
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
type WorkspaceSection = 'info' | 'planning' | 'chapters' | 'scenes' | 'characters' | 'locations' | 'factions' | 'species' | 'rules' | 'worldItems' | 'assets';
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type ModuleKind = 'characters' | 'locations' | 'factions' | 'species' | 'rules' | 'worldItems' | 'storyItems' | 'abilities';
type RelationshipTargetType = Exclude<RelationshipEntityType, 'chapter' | 'chapter_plan'>;
type RelationshipTargetOption = { type: RelationshipTargetType; id: string; label: string; summary?: string };
type SelectOption = { label: string; value: string };
type DetailTab = 'overview' | 'relations';
type RelationshipDirectionInput = 'from_current' | 'to_current' | 'bidirectional';
type StatusFilterOption = { label: string; value: string; rawValue?: string };
type DetailField = { key: string; label: string; long?: boolean; options?: SelectOption[] };
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

const workspaceSections: WorkspaceSection[] = ['info', 'planning', 'chapters', 'scenes', 'characters', 'locations', 'factions', 'species', 'rules', 'worldItems', 'assets'];
const localEntityIdPrefixes = ['local-', 'sample-', 'placeholder-', 'example-'] as const;
const worldItemTypeOptions = [
  { value: 'system', label: '体系' },
  { value: 'history', label: '历史' },
  { value: 'culture', label: '文化' },
  { value: 'concept', label: '概念' },
  { value: 'social_system', label: '社会制度' },
  { value: 'custom', label: '自定义' },
];
const allowedWorldItemTypes = new Set(worldItemTypeOptions.map((option) => option.value));

const projectStatusOptions = statusOptions(['planning', 'active', 'paused', 'completed', 'archived'] as const);
const projectLongFields = new Set(['logline', 'summary', 'premise', 'coreIdea', 'mainPlot', 'intro', 'storySeed', 'worldview', 'eraBackground', 'writingStyle']);
const projectNullableFields = new Set(['subtitle', 'logline', 'summary', 'premise', 'coreIdea', 'mainPlot', 'intro', 'storySeed', 'worldview', 'eraBackground', 'targetLength', 'estimatedChapters', 'wordsPerChapter', 'writingStyle', 'tone', 'pov', 'protagonist']);
const projectInfoGroups: DetailGroup[] = [
  {
    title: t('projects.detail.basicInfo'),
    fields: [
      { key: 'title', label: t('projects.creation.titleLabel') },
      { key: 'subtitle', label: t('projects.workspace.info.subtitle') },
      { key: 'status', label: t('projects.workspace.info.status'), options: projectStatusOptions },
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

type DedicatedRelationshipRoute = {
  sourceType: RelationshipTargetType;
  targetType: RelationshipTargetType;
  message: string;
};

const dedicatedRelationshipRoutes: DedicatedRelationshipRoute[] = [
  { sourceType: 'character', targetType: 'faction', message: '这类关系请在对应势力的「势力成员」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'location', targetType: 'world_rule', message: '这类关系请在下方「地点规则」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'location', targetType: 'faction', message: '这类关系请在下方「地点势力」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'faction', targetType: 'character', message: '这类关系请在下方「势力成员」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'faction', targetType: 'faction', message: '这类关系请在下方「势力关系」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'faction', targetType: 'world_rule', message: '这类关系请在下方「势力规则」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'species', targetType: 'world_rule', message: '这类关系请在下方「物种规则」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'story_item', targetType: 'world_rule', message: '这类关系请在下方「道具规则」中维护。通用关系仅用于没有专用面板的补充记录。' },
  { sourceType: 'ability', targetType: 'world_rule', message: '这类关系请在下方「能力规则」中维护。通用关系仅用于没有专用面板的补充记录。' },
];

const defaultRelationshipTypeOptions: SelectOption[] = [
  { value: 'related_to', label: '相关' },
  { value: 'ally', label: '同盟' },
  { value: 'rival', label: '竞争者' },
  { value: 'enemy', label: '敌对' },
  { value: 'custom', label: '自定义' },
];

const relationshipTypeOptionsByTargetType: Partial<Record<RelationshipTargetType, SelectOption[]>> = {
  character: [
    { value: 'family', label: '亲属' },
    { value: 'mentor_student', label: '师徒' },
    { value: 'lover', label: '恋人' },
    { value: 'friend', label: '朋友' },
    { value: 'enemy', label: '敌人' },
    { value: 'ally', label: '同盟' },
    { value: 'rival', label: '竞争者' },
    { value: 'savior', label: '救命恩人' },
    { value: 'secret_identity', label: '秘密身份' },
    { value: 'custom', label: '自定义' },
  ],
  location: [
    { value: 'born_in', label: '出生于' },
    { value: 'lives_in', label: '居住于' },
    { value: 'visited', label: '曾到访' },
    { value: 'guards', label: '守护' },
    { value: 'exiled_from', label: '被放逐自' },
    { value: 'missing_at', label: '失踪于' },
    { value: 'sealed_at', label: '被封印于' },
    { value: 'custom', label: '自定义' },
  ],
  faction: [
    { value: 'member', label: '成员' },
    { value: 'leader', label: '领袖' },
    { value: 'elder', label: '长老' },
    { value: 'disciple', label: '弟子' },
    { value: 'undercover', label: '卧底' },
    { value: 'traitor', label: '叛徒' },
    { value: 'wanted_by', label: '被追捕' },
    { value: 'cooperates_with', label: '合作' },
    { value: 'alliance', label: '联盟' },
    { value: 'hostility', label: '敌对' },
    { value: 'vassal', label: '附庸' },
    { value: 'custom', label: '自定义' },
  ],
  world_rule: [
    { value: 'applies', label: '适用' },
    { value: 'exempt', label: '豁免' },
    { value: 'violates', label: '违反' },
    { value: 'uses_rule', label: '利用' },
    { value: 'maintains', label: '维护' },
    { value: 'opposes', label: '对抗' },
    { value: 'primary_rule', label: '主要规则' },
    { value: 'secondary_rule', label: '次要规则' },
    { value: 'custom', label: '自定义' },
  ],
  story_item: [
    { value: 'owns', label: '拥有' },
    { value: 'uses', label: '使用' },
    { value: 'inherits', label: '继承' },
    { value: 'seeks', label: '寻找' },
    { value: 'lost', label: '遗失' },
    { value: 'seals', label: '封印' },
    { value: 'contends_for', label: '争夺' },
    { value: 'custom', label: '自定义' },
  ],
  ability: [
    { value: 'uses', label: '使用' },
    { value: 'learns', label: '学习' },
    { value: 'teaches', label: '传授' },
    { value: 'sealed_ability', label: '被封印' },
    { value: 'countered_by', label: '被克制' },
    { value: 'custom', label: '自定义' },
  ],
};

const relationshipTypeOptions = defaultRelationshipTypeOptions;

const subFieldLabels: Record<string, string> = {
  title: '身份标题', description: '描述', type: '类型', isPublic: '公开', startsAt: '开始', endsAt: '结束', importance: '重要度',
  chapterId: '关联章节', stage: '阶段', orderIndex: '排序', location: '位置', physicalState: '身体状态', emotionalState: '情绪状态', goal: '目标', knownSecrets: '已知秘密', relationshipChanges: '关系变化', statusNote: '状态备注',
  lifecycleStatus: '生命周期状态', dangerLevel: '危险等级', accessRule: '进入规则', visibility: '可见性', environmentChanges: '环境变化', controlSummary: '控制情况', eventSummary: '事件摘要', stateNote: '状态备注',
  worldRuleId: '世界规则', relationType: '关系类型', isPrimary: '主规则', enforcementLevel: '执行强度', notes: '备注',
  factionId: '势力', influenceLevel: '影响力', isCurrent: '当前有效',
  status: '状态', powerLevel: '权力等级', resourceState: '资源状态', internalState: '内部状态', publicReputation: '公众声誉', conflictSummary: '冲突摘要',
  characterId: '人物', membershipType: '成员类型', roleTitle: '角色头衔', rank: '等级', department: '部门',
  targetFactionId: '目标势力', direction: '方向', strength: '强度',
  traitType: '特征类型', name: '名称', summary: '简介', isInheritable: '可遗传', isCommon: '常见',
  aliases: '别名', abilityType: '能力类型', effect: '效果', cost: '代价', limitation: '限制', condition: '条件', inheritanceType: '遗传类型', awakeningCondition: '觉醒条件', masteryNotes: '掌握要点', isUnique: '唯一',
  owner: '持有者', powerState: '力量状态', sourceType: '来源方式', sourceId: '来源备注',
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

const relationSubResourceKinds = new Set<SubResourceKind>([
  'locationRules',
  'locationFactions',
  'factionMemberships',
  'factionRelations',
  'factionRules',
  'speciesRules',
  'storyItemRules',
  'abilityRules',
]);

function isRelationDetailGroup(group: DetailGroup) {
  return group.title.includes('关系');
}

function filterDetailGroups(groups: DetailGroup[], predicate: (field: DetailField, group: DetailGroup) => boolean) {
  return groups
    .map((group) => ({ ...group, fields: group.fields.filter((field) => predicate(field, group)) }))
    .filter((group) => group.fields.length > 0);
}

function overviewDetailGroups(groups: DetailGroup[]) {
  return filterDetailGroups(groups.filter((group) => !isRelationDetailGroup(group)), (field) => !isRelationField(field.key));
}

function relationSummaryGroups(groups: DetailGroup[], values: Record<string, unknown>) {
  return filterDetailGroups(groups, (field) => isRelationField(field.key) && relationItems(values[field.key]).length > 0);
}

function splitSubResourceConfigs(configs: SubResourceConfig[]) {
  return {
    overview: configs.filter((config) => !relationSubResourceKinds.has(config.kind)),
    relations: configs.filter((config) => relationSubResourceKinds.has(config.kind)),
  };
}

function fields(keys: string[], long = false): DetailField[] {
  return keys.map((key) => ({ key, label: t(`modules.fields.${key}` as Parameters<typeof t>[0]), long }));
}

function record(id: string, name: string, summary: string, type: string, status: string, importance: number, values: Record<string, string | number | null | undefined>): EntityRecord {
  return { id, name, summary, type: displayOptionLabel(worldItemTypeOptions, type), status: statusLabel(status, ''), importance, updatedAt: new Date().toISOString(), fields: { name, title: name, summary, importance, ...values } };
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
  if (typeof value === 'object') return readableStructuredText(value);
  return statusLabel(String(value), String(value));
}

function readableStructuredText(value: unknown): string {
  if (Array.isArray(value)) return value.map(compactText).filter(Boolean).join('、') || t('common.notFilled');
  if (isRecordValue(value)) {
    return Object.entries(value)
      .filter(([, entryValue]) => !isEmptyDisplayValue(entryValue))
      .map(([key, entryValue]) => `${subFieldLabels[key] ?? key}：${compactText(entryValue)}`)
      .join('\n') || t('common.notFilled');
  }
  return String(value);
}

function isEmptyDisplayValue(value: unknown) {
  return value === null || value === undefined || value === '';
}

function displayText(value: unknown) {
  return isEmptyDisplayValue(value) ? t('common.notFilled') : compactText(value);
}

function displayOptionLabel(options: SelectOption[] | undefined, value: unknown) {
  if (value === undefined || value === null || value === '') return '';
  return options?.find((option) => option.value === value)?.label ?? String(value);
}

function displayFieldValue(field: DetailField, value: unknown) {
  if (field.options && !isEmptyDisplayValue(value)) return displayOptionLabel(field.options, value);
  if (isStatusField(field.key)) return statusLabel(value as string | null | undefined, '');
  return displayText(value);
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
    status: statusLabel(character.lifeStatus || character.canonStatus, ''),
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
    status: statusLabel(location.lifecycleStatus || location.canonStatus, ''),
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
    status: statusLabel(String(latestState?.status ?? faction.status ?? faction.canonStatus), ''),
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
    status: statusLabel(species.status || species.rarity || species.canonStatus, ''),
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
    status: statusLabel(String(latestState?.lifecycleStatus ?? storyItem.lifecycleStatus ?? storyItem.canonStatus), ''),
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
    status: statusLabel(ability.visibility || ability.canonStatus, ''),
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
    status: statusLabel(profileRule.status || profileRule.canonStatus, ''),
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
    type: displayOptionLabel(worldItemTypeOptions, worldItem.type),
    status: statusLabel(worldItem.visibility || worldItem.canonStatus, ''),
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
  if (value === null) return null as unknown as string | undefined;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function nullifyEmptyFields(values: Record<string, unknown>, fields: DetailField[]) {
  const next = { ...values };
  for (const field of fields) {
    if (next[field.key] === '' || next[field.key] === undefined) next[field.key] = null;
  }
  return next;
}

function parseSubResourceInput(values: Record<string, unknown>, config: SubResourceConfig, isNew: boolean) {
  return config.fields.reduce<Record<string, unknown>>((acc, field) => {
    const value = values[field.key];
    if (value === '' || value === undefined || value === null) {
      if (!isNew && !config.requiredFields?.includes(field.key)) acc[field.key] = null;
      return acc;
    }
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
  const isNew = !selected || !isPersistedEntityId(selected.id);
  const input = parseSubResourceInput(values, config, isNew);
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
          {activeSection === 'info' ? <ProjectInfoPanel project={project} onSave={(input) => onProjectUpdate(project.id, input)} onDelete={onDelete} /> : activeSection === 'planning' ? <PlanningWorkspace projectId={project.id} /> : activeSection === 'chapters' ? <ChapterWorkspace projectId={project.id} /> : activeSection === 'scenes' ? <SceneWorkspace projectId={project.id} /> : activeSection === 'assets' ? <AssetsModule projectId={project.id} /> : <EntityModule key={`${project.id}:${activeSection}`} projectId={project.id} config={moduleConfigs[activeSection]} />}
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
      const value = values[field.key];
      if (value === '' || value === undefined || value === null) {
        if (projectNullableFields.has(field.key)) acc[field.key] = null;
        return acc;
      }
      acc[field.key] = value;
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
  const normalizedValues = isNew ? values : nullifyEmptyFields(values, moduleConfigs[kind].groups.flatMap((group) => group.fields));
  switch (kind) {
    case 'characters': {
      const input = recordToCharacterInput(normalizedValues);
      return characterToRecord(isNew ? await createCharacter(projectId, input) : await updateCharacter(projectId, selected.id, input));
    }
    case 'locations': {
      const input = recordToLocationInput(normalizedValues);
      return locationToRecord(isNew ? await createLocation(projectId, input) : await updateLocation(projectId, selected.id, input));
    }
    case 'factions': {
      const input = recordToFactionInput(normalizedValues);
      return factionToRecord(isNew ? await createFaction(projectId, input) : await updateFaction(projectId, selected.id, input));
    }
    case 'species': {
      const input = recordToSpeciesInput(normalizedValues);
      return speciesToRecord(isNew ? await createSpecies(projectId, input) : await updateSpecies(projectId, selected.id, input));
    }
    case 'storyItems': {
      const input = recordToStoryItemInput(normalizedValues);
      return storyItemToRecord(isNew ? await createStoryItem(projectId, input) : await updateStoryItem(projectId, selected.id, input));
    }
    case 'abilities': {
      const input = recordToAbilityInput(normalizedValues);
      return abilityToRecord(isNew ? await createAbility(projectId, input) : await updateAbility(projectId, selected.id, input));
    }
    case 'rules': {
      const input = recordToWorldRuleInput(normalizedValues);
      return worldRuleToRecord(isNew ? await createWorldRule(projectId, input) : await updateWorldRule(projectId, selected.id, input));
    }
    case 'worldItems': {
      const input = recordToWorldItemInput(normalizedValues, selected.fields.type);
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
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

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
  const statusOptions = uniqueStatusFilterOptions(records.map((recordItem) => recordItem.fields.status ?? recordItem.status));
  const visibleRecords = records.filter((recordItem) => {
    const rawStatus = String(recordItem.fields.status ?? recordItem.status ?? '');
    const text = [recordItem.name, recordItem.summary, recordItem.type, recordItem.status, statusLabel(rawStatus, ''), ...Object.values(recordItem.fields).map((value) => compactText(value))].join(' ').toLowerCase();
    const matchQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchType = !filter.type || recordItem.type === filter.type;
    const matchStatus = !filter.status || rawStatus === filter.status;
    const matchImportance = !filter.importance || (filter.importance === 'high' ? (recordItem.importance ?? 0) >= 7 : (recordItem.importance ?? 0) < 7);
    return matchQuery && matchType && matchStatus && matchImportance;
  });
  const hasActiveSearch = Boolean(query.trim()) || !isEmptyFilter(filter);
  const emptyTitle = hasActiveSearch ? t('modules.emptyAfterFilter') : t('modules.emptyModuleTitle');
  const emptyDescription = hasActiveSearch ? t('modules.emptyFilterDescription') : t('modules.emptyModuleDescription');
  const overviewGroups = overviewDetailGroups(config.groups);
  const editGroups = overviewGroups;
  const selectedRelationSummaryGroups = selected ? relationSummaryGroups(config.groups, selected.fields) : [];
  const { overview: overviewSubResources, relations: relationSubResources } = splitSubResourceConfigs(subResourceConfigs[config.kind] ?? []);
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
    setDetailTab('overview');
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
    setDetailTab('overview');
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
      setDetailTab('overview');
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
        <Select placeholder={t('modules.statusFilter')} value={filter.status} onChange={(value) => setFilter((current) => ({ ...current, status: value as string }))} showClear style={{ width: 140 }}>{statusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Select>
        <Select placeholder={t('modules.importanceFilter')} value={filter.importance} onChange={(value) => setFilter((current) => ({ ...current, importance: value as string }))} showClear style={{ width: 140 }}><Select.Option value="high">7+</Select.Option><Select.Option value="normal">0-6</Select.Option></Select>
        {filter.type ? <Tag closable onClose={() => setFilter((current) => ({ ...current, type: undefined }))}>{t('modules.typeFilter')}: {filter.type}</Tag> : null}
        {filter.status ? <Tag closable onClose={() => setFilter((current) => ({ ...current, status: undefined }))}>{t('modules.statusFilter')}: {statusLabel(filter.status, filter.status)}</Tag> : null}
        {filter.importance ? <Tag closable onClose={() => setFilter((current) => ({ ...current, importance: undefined }))}>{t('modules.importanceFilter')}: {filter.importance}</Tag> : null}
        {(!isEmptyFilter(filter) || query) ? <Button theme="borderless" onClick={clearFilter}>{t('actions.clear')}</Button> : null}
      </Space>
    </Card>
    <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16 }}>
      <Card style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 12 }}>
        {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading /> : errorEmpty ?? (visibleRecords.length === 0 ? listEmpty : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{visibleRecords.map((recordItem) => <button key={recordItem.id} type="button" onClick={() => handleSelectRecord(recordItem.id)} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${recordItem.id === selected?.id ? 'var(--semi-color-primary-light-active)' : 'var(--semi-color-border)'}`, background: recordItem.id === selected?.id ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', cursor: 'pointer' }}><Text strong ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>{recordItem.name}</Text><Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ display: 'block', marginTop: 4 }}>{recordItem.summary || recordItem.type || config.metaFallback}</Text><Space spacing={4} style={{ marginTop: 8 }}>{recordItem.type ? <Tag size="small">{recordItem.type}</Tag> : null}{recordItem.status ? <StatusTag status={recordItem.status} /> : null}</Space></button>)}</div>)}
      </Card>
      <Card style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 20 }}>
        {!selected ? detailEmpty : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <Title heading={4} style={{ margin: 0 }}>{selected.name}</Title>
              <Text type="tertiary">{selected.updatedAt ? formatDate(selected.updatedAt) : config.metaFallback}</Text>
            </div>
            {editing ? <Space><Button onClick={handleCancelEdit}>{t('actions.cancel')}</Button><Button theme="solid" type="primary" loading={saving} onClick={handleSave}>{t('actions.save')}</Button></Space> : <Space><Button icon={<IconEdit />} onClick={() => setEditing(true)}>{t('actions.edit')}</Button><Popconfirm title={t('modules.deleteTitle')} content={t('modules.deleteContent')} onConfirm={handleDelete}><Button icon={<IconDelete />} type="danger" theme="borderless">{t('actions.delete')}</Button></Popconfirm></Space>}
          </div>
          {editing ? <Form key={selected.id} initValues={selected.fields} getFormApi={setFormApi} labelPosition="top"><GroupedForm groups={editGroups} nameLabel={config.nameLabel} namePlaceholder={config.namePlaceholder} /></Form> : <>
            <Space spacing={8} style={{ marginBottom: 16 }}>
              <Button size="small" theme={detailTab === 'overview' ? 'solid' : 'light'} type={detailTab === 'overview' ? 'primary' : 'tertiary'} onClick={() => setDetailTab('overview')}>概览</Button>
              <Button size="small" theme={detailTab === 'relations' ? 'solid' : 'light'} type={detailTab === 'relations' ? 'primary' : 'tertiary'} onClick={() => setDetailTab('relations')}>关系</Button>
            </Space>
            {detailTab === 'overview' ? <><GroupedDetails groups={overviewGroups} values={selected.fields} /><SubResourceSections projectId={projectId} parentId={selected.id} configs={overviewSubResources} /></> : <><EntityRelationsPanel projectId={projectId} entityType={moduleEntityType[config.kind]} entityId={selected.id} entityName={selected.name} /><ReadonlyRelationSummary groups={selectedRelationSummaryGroups} values={selected.fields} /><SubResourceSections projectId={projectId} parentId={selected.id} configs={relationSubResources} /></>}
          </>}
        </>}
      </Card>
    </div>
  </ModuleShell>;
}

function uniqueStatusFilterOptions(values: unknown[]): StatusFilterOption[] {
  const options = new Map<string, StatusFilterOption>();
  for (const value of values) {
    if (isEmptyDisplayValue(value)) continue;
    const rawValue = String(value);
    const label = statusLabel(rawValue, rawValue);
    if (!options.has(rawValue)) options.set(rawValue, { value: rawValue, rawValue, label });
  }
  return [...options.values()].sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));
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
  const [lookupOptions, setLookupOptions] = useState<Record<string, SelectOption[]>>({});

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

  useEffect(() => {
    let cancelled = false;
    loadSubResourceLookupOptions(projectId)
      .then((options) => {
        if (!cancelled) setLookupOptions(options);
      })
      .catch(() => {
        if (!cancelled) setLookupOptions({});
      });
    return () => { cancelled = true; };
  }, [projectId]);

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
            <Text strong>{displayLookupValue(config.titleField, item.title, lookupOptions)}</Text>
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
      {editingItem ? <Form key={editingItem.id} initValues={editingItem.fields} getFormApi={setFormApi} labelPosition="top"><SubResourceForm config={config} lookupOptions={lookupOptions} /></Form> : null}
    </SideSheet>
  </section>;
}


async function loadSubResourceLookupOptions(projectId: string): Promise<Record<string, SelectOption[]>> {
  const [chapters, characters, factions, rules] = await Promise.all([
    listChapters(projectId).catch(() => [] as Chapter[]),
    listCharacters(projectId).catch(() => [] as Character[]),
    listFactions(projectId).catch(() => [] as Faction[]),
    listWorldRules(projectId).catch(() => [] as WorldRule[]),
  ]);
  const chapterOptions = itemsFromResponse<Chapter>(chapters).map((chapter) => ({ value: chapter.id, label: `#${chapter.orderIndex} ${chapter.title}` }));
  const characterOptions = persistedItemsFromResponse<Character>(characters).map((character) => ({ value: character.id, label: character.name }));
  const factionOptions = persistedItemsFromResponse<Faction>(factions).map((faction) => ({ value: faction.id, label: faction.name }));
  const worldRuleOptions = persistedItemsFromResponse<WorldRule>(rules).map((rule) => ({ value: rule.id, label: rule.title }));
  return {
    chapterId: chapterOptions,
    characterId: characterOptions,
    factionId: factionOptions,
    targetFactionId: factionOptions,
    worldRuleId: worldRuleOptions,
  };
}

function displayLookupValue(fieldKey: string, value: unknown, lookupOptions: Record<string, SelectOption[]>) {
  const text = compactText(value);
  return lookupOptions[fieldKey]?.find((option) => option.value === value)?.label ?? text;
}

function SubResourceForm({ config, lookupOptions }: { config: SubResourceConfig; lookupOptions: Record<string, SelectOption[]> }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
    {config.fields.map((field) => {
      const rules = config.requiredFields?.includes(field.key) ? [{ required: true, message: `请填写${field.label}` }] : undefined;
      if (config.booleanFields?.includes(field.key)) return <Form.Switch key={field.key} field={field.key} label={field.label} />;
      if (config.numberFields?.includes(field.key)) return <Form.InputNumber key={field.key} field={field.key} label={field.label} style={{ width: '100%' }} rules={rules} />;
      if (lookupOptions[field.key]) return <Form.Select key={field.key} field={field.key} label={field.label} placeholder="请选择" showClear style={{ width: '100%' }} rules={rules}>{lookupOptions[field.key].map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>;
      if (field.long || config.longFields?.includes(field.key)) return <Form.TextArea key={field.key} field={field.key} label={field.label} autosize={{ minRows: 3, maxRows: 8 }} style={{ gridColumn: '1 / -1' }} rules={rules} />;
      return <Form.Input key={field.key} field={field.key} label={field.label} rules={rules} />;
    })}
  </div>;
}

function EntityRelationsPanel({ projectId, entityType, entityId, entityName }: { projectId: string; entityType: RelationshipTargetType; entityId: string; entityName: string }) {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [targetOptions, setTargetOptions] = useState<RelationshipTargetOption[]>([]);
  const [targetType, setTargetType] = useState<RelationshipTargetType>('character');
  const [targetId, setTargetId] = useState<string>();
  const [relationType, setRelationType] = useState('related_to');
  const [direction, setDirection] = useState<RelationshipDirectionInput>('from_current');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [canonStatus, setCanonStatus] = useState('draft');
  const [strength, setStrength] = useState<number>(50);
  const [typeFilter, setTypeFilter] = useState<RelationshipTargetType | 'all'>('all');
  const [canonFilter, setCanonFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [groupByType, setGroupByType] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
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
        const nextType = first?.type ?? 'character';
        setTargetType(nextType);
        setTargetId(first?.id);
        setRelationType(relationshipTypeOptionsFor(nextType)[0]?.value ?? 'related_to');
      })
      .catch(() => {
        if (cancelled) return;
        setTargetOptions([]);
        setTargetId(undefined);
      });
    return () => { cancelled = true; };
  }, [entityId, entityType, projectId]);

  useEffect(() => {
    refreshRelationships();
  }, [refreshRelationships]);

  const optionByKey = new Map(targetOptions.map((option) => [`${option.type}:${option.id}`, option]));
  const targetRelationTypes = relationshipTypeOptionsFor(targetType);
  const selectableTargets = targetOptions.filter((option) => option.type === targetType && !(option.type === entityType && option.id === entityId));
  const relationshipRows = relationships.map((relationship) => relationshipDisplayModel(relationship, entityType, entityId, entityName, optionByKey));
  const filteredRows = relationshipRows.filter((row) => {
    const matchType = typeFilter === 'all' || row.otherType === typeFilter;
    const matchCanon = canonFilter === 'all' || row.relationship.canonStatus === canonFilter;
    const haystack = [row.otherName, row.otherTypeLabel, row.relationTypeLabel, row.directionLabel, row.description, row.timeRange, row.canonLabel].join(' ').toLowerCase();
    const matchSearch = !searchText.trim() || haystack.includes(searchText.trim().toLowerCase());
    return matchType && matchCanon && matchSearch;
  });
  const groupedRows = groupByType ? groupRowsByType(filteredRows) : [['全部关系', filteredRows] as const];
  const selectedDedicatedRoute = dedicatedRelationshipRouteFor(entityType, targetType);
  const dedicatedRouteMessage = selectedDedicatedRoute ? dedicatedRelationshipRouteMessage(selectedDedicatedRoute) : '';
  const saveRelationshipDisabled = !targetId || Boolean(selectedDedicatedRoute);
  const currentCount = relationships.filter((relationship) => relationship.isCurrent).length;
  const draftCount = relationships.filter((relationship) => relationship.canonStatus === 'draft').length;
  const confirmedCount = relationships.filter((relationship) => relationship.canonStatus === 'confirmed').length;
  const archivedCount = relationships.filter((relationship) => relationship.canonStatus === 'archived').length;

  function handleTargetTypeChange(nextType: RelationshipTargetType) {
    setTargetType(nextType);
    const nextOptions = relationshipTypeOptionsFor(nextType);
    setRelationType(nextOptions[0]?.value ?? 'related_to');
    const first = targetOptions.find((option) => option.type === nextType && !(option.type === entityType && option.id === entityId));
    setTargetId(first?.id);
  }

  function resetCreateForm() {
    setDescription('');
    setStartsAt('');
    setEndsAt('');
    setCanonStatus('draft');
    setDirection('from_current');
    setStrength(50);
  }

  async function handleCreateRelationship() {
    if (!isPersistedEntityId(entityId) || !isPersistedEntityId(targetId) || !relationType.trim()) {
      Notification.error({ title: t('messages.createFailed'), content: '请选择目标对象和关系类型' });
      return;
    }
    if (selectedDedicatedRoute) {
      Notification.warning({ title: '请使用专用面板', content: dedicatedRouteMessage });
      return;
    }
    setSaving(true);
    try {
      const sourceType = direction === 'to_current' ? targetType : entityType;
      const targetRelationshipType = direction === 'to_current' ? entityType : targetType;
      const input: RelationshipInput = {
        sourceType,
        sourceId: direction === 'to_current' ? targetId : entityId,
        targetType: targetRelationshipType,
        targetId: direction === 'to_current' ? entityId : targetId,
        relationType: relationType.trim(),
        direction: direction === 'bidirectional' ? 'bidirectional' : 'directed',
        description: description.trim() || undefined,
        startsAt: startsAt.trim() || undefined,
        endsAt: endsAt.trim() || undefined,
        canonStatus,
        isCurrent: true,
        strength,
      };
      const dedicatedRoute = dedicatedRelationshipRouteFor(sourceType, targetRelationshipType);
      if (dedicatedRoute) {
        Notification.warning({ title: '请使用专用面板', content: dedicatedRelationshipRouteMessage(dedicatedRoute) });
        return;
      }
      await createRelationship(projectId, input);
      resetCreateForm();
      setSheetVisible(false);
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

  return <section style={{ width: '100%', padding: '2px 0 14px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
      <div>
        <Title heading={5} style={{ margin: 0 }}>关系</Title>
        <Text type="tertiary" size="small">{entityName} 的通用关系列表；成员、规则、势力等专用关系在下方对应面板管理。</Text>
      </div>
      <Button size="small" theme="solid" type="primary" icon={<IconPlus />} onClick={() => setSheetVisible(true)}>新增关系</Button>
    </div>

    <Card style={{ borderRadius: 12, marginBottom: 12 }} bodyStyle={{ padding: 12 }}>
      <Space wrap spacing={8} style={{ rowGap: 8 }}>
        <Text strong>共 {relationships.length} 条关联</Text>
        <Tag color="green" size="small">当前有效 {currentCount}</Tag>
        <StatusTag status="draft" label={`草稿 ${draftCount}`} />
        <StatusTag status="confirmed" label={`已确认 ${confirmedCount}`} />
        <StatusTag status="archived" label={`已归档 ${archivedCount}`} />
        {relationshipTargetTypes.map((type) => {
          const count = relationshipRows.filter((row) => row.otherType === type.value).length;
          return count > 0 ? <Tag key={type.value} size="small">{type.label} {count}</Tag> : null;
        })}
      </Space>
    </Card>

    <Card style={{ borderRadius: 12, marginBottom: 12 }} bodyStyle={{ padding: 12 }}>
      <Space wrap spacing={8} style={{ width: '100%', rowGap: 8 }}>
        <Select value={typeFilter} onChange={(value) => setTypeFilter(value as RelationshipTargetType | 'all')} style={{ width: 150 }}>
          <Select.Option value="all">全部类型</Select.Option>
          {relationshipTargetTypes.map((type) => <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>)}
        </Select>
        <Select value={canonFilter} onChange={(value) => setCanonFilter(value as string)} style={{ width: 150 }}>
          <Select.Option value="all">全部正史状态</Select.Option>
          <Select.Option value="draft">草稿</Select.Option>
          <Select.Option value="confirmed">已确认</Select.Option>
          <Select.Option value="archived">已归档</Select.Option>
        </Select>
        <Input prefix={<IconSearch />} value={searchText} onChange={setSearchText} placeholder="搜索对象、关系或说明" style={{ width: 220 }} />
        <Button size="small" theme={groupByType ? 'solid' : 'light'} type={groupByType ? 'primary' : 'tertiary'} onClick={() => setGroupByType((value) => !value)}>按类型分组</Button>
      </Space>
    </Card>

    {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={4} />} loading /> : filteredRows.length === 0 ? <Empty title="暂无通用关系" description="可通过新增关系记录当前实体与其他对象的通用关系。" image={<IllustrationNoContent style={{ width: 120, height: 120 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 120, height: 120 }} />} /> : <div style={{ display: 'grid', gap: 12 }}>
      {groupedRows.map(([groupTitle, rows]) => rows.length > 0 ? <div key={groupTitle} style={{ display: 'grid', gap: 10 }}>
        {groupByType ? <Text strong>{groupTitle}</Text> : null}
        {rows.map((row) => <div key={row.relationship.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 12, alignItems: 'start', padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 10, background: 'var(--semi-color-bg-0)' }}>
          <div style={{ minWidth: 0 }}>
            <Space wrap spacing={6} style={{ rowGap: 6 }}>
              <Tag color="blue" size="small">{row.relationTypeLabel}</Tag>
              <Tag size="small">通用关系</Tag>
              <Tag size="small">{row.directionLabel}</Tag>
              <Tag size="small">{row.otherTypeLabel}：{row.otherName}</Tag>
              <Tag size="small">{row.currentLabel}</Tag>
              {row.relationship.strength !== null && row.relationship.strength !== undefined ? <Tag size="small">强度 {row.relationship.strength}</Tag> : null}
              <StatusTag status={row.relationship.canonStatus} />
            </Space>
            {row.timeRange ? <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 6 }}>{row.timeRange}</Text> : null}
            {row.description ? <Paragraph ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{row.description}</Paragraph> : null}
          </div>
          <Popconfirm title={t('modules.deleteTitle')} content={t('modules.deleteContent')} onConfirm={() => handleDeleteRelationship(row.relationship.id)}>
            <Button icon={<IconDelete />} type="danger" theme="borderless" />
          </Popconfirm>
        </div>)}
      </div> : null)}
    </div>}

    <SideSheet title="新增通用关系" visible={sheetVisible} onCancel={() => setSheetVisible(false)} width={560} footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={() => setSheetVisible(false)}>{t('actions.cancel')}</Button><Button theme="solid" type="primary" loading={saving} disabled={saveRelationshipDisabled} onClick={handleCreateRelationship}>{t('actions.save')}</Button></div>}>
      <Space vertical align="start" spacing={14} style={{ width: '100%' }}>
        <Text type="tertiary">当前实体：{entityName} · {entityTypeLabel(entityType)}</Text>
        <Select value={targetType} onChange={(value) => handleTargetTypeChange(value as RelationshipTargetType)} style={{ width: '100%' }}>
          {relationshipTargetTypes.map((type) => <Select.Option key={type.value} value={type.value}>{type.label}</Select.Option>)}
        </Select>
        <Select value={targetId} placeholder="选择目标对象" onChange={(value) => setTargetId(value as string)} filter style={{ width: '100%' }}>
          {selectableTargets.map((option) => <Select.Option key={`${option.type}:${option.id}`} value={option.id}>{option.label}{option.summary ? ` · ${option.summary}` : ''}</Select.Option>)}
        </Select>
        <Select value={direction} onChange={(value) => setDirection(value as RelationshipDirectionInput)} style={{ width: '100%' }}>
          <Select.Option value="from_current">{entityName} → 目标</Select.Option>
          <Select.Option value="to_current">目标 → {entityName}</Select.Option>
          <Select.Option value="bidirectional">双向</Select.Option>
        </Select>
        {selectedDedicatedRoute ? <Card style={{ width: '100%', borderRadius: 10, borderColor: 'var(--semi-color-warning-light-default)', background: 'var(--semi-color-warning-light-default)' }} bodyStyle={{ padding: 12 }}>
          <Text strong style={{ display: 'block', marginBottom: 4 }}>请改用专用关系面板</Text>
          <Text size="small">{dedicatedRouteMessage}</Text>
        </Card> : null}
        <Select value={relationType} onChange={(value) => setRelationType(value as string)} placeholder="关系类型" style={{ width: '100%' }}>
          {targetRelationTypes.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}
        </Select>
        <div style={{ width: '100%' }}>
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>强度：{strength}</Text>
          <Input value={String(strength)} onChange={(value) => setStrength(Math.max(0, Math.min(100, Number(value) || 0)))} placeholder="0-100" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
          <Input value={startsAt} onChange={setStartsAt} placeholder="开始阶段 / 章节（可选）" />
          <Input value={endsAt} onChange={setEndsAt} placeholder="结束阶段 / 章节（可选）" />
        </div>
        <Input value={description} onChange={setDescription} placeholder="说明：这段关系为什么重要？" style={{ width: '100%' }} />
        <Select value={canonStatus} onChange={(value) => setCanonStatus(value as string)} style={{ width: '100%' }}>
          <Select.Option value="draft">草稿</Select.Option>
          <Select.Option value="confirmed">已确认</Select.Option>
          <Select.Option value="archived">已归档</Select.Option>
        </Select>
      </Space>
    </SideSheet>
  </section>;
}


type RelationshipDisplayRow = {
  relationship: Relationship;
  otherType: RelationshipEntityType;
  otherTypeLabel: string;
  otherName: string;
  relationTypeLabel: string;
  directionLabel: string;
  description: string;
  timeRange: string;
  currentLabel: string;
  canonLabel: string;
};

function relationshipTypeOptionsFor(targetType: RelationshipTargetType) {
  return relationshipTypeOptionsByTargetType[targetType] ?? defaultRelationshipTypeOptions;
}

function dedicatedRelationshipRouteFor(sourceType: RelationshipTargetType, targetType: RelationshipTargetType) {
  return dedicatedRelationshipRoutes.find((route) => {
    const sameOrder = route.sourceType === sourceType && route.targetType === targetType;
    const reverseOrder = route.sourceType === targetType && route.targetType === sourceType;
    return sameOrder || reverseOrder;
  });
}

function dedicatedRelationshipRouteMessage(route: DedicatedRelationshipRoute) {
  return route.message;
}

function allRelationshipTypeOptions() {
  const options = new Map<string, SelectOption>();
  [...defaultRelationshipTypeOptions, ...Object.values(relationshipTypeOptionsByTargetType).flat()].forEach((option) => options.set(option.value, option));
  return [...options.values()];
}

function relationshipDisplayModel(relationship: Relationship, entityType: RelationshipTargetType, entityId: string, entityName: string, optionByKey: Map<string, RelationshipTargetOption>): RelationshipDisplayRow {
  const sourceIsCurrent = relationship.sourceType === entityType && relationship.sourceId === entityId;
  const otherType = sourceIsCurrent ? relationship.targetType : relationship.sourceType;
  const otherId = sourceIsCurrent ? relationship.targetId : relationship.sourceId;
  const other = optionByKey.get(`${otherType}:${otherId}`);
  const directionLabel = relationship.direction === 'bidirectional'
    ? `${entityName} ↔ ${other?.label ?? '目标'}`
    : sourceIsCurrent ? `${entityName} → ${other?.label ?? '目标'}` : `${other?.label ?? '目标'} → ${entityName}`;
  const timeRange = [relationship.startsAt ? `开始：${relationship.startsAt}` : '', relationship.endsAt ? `结束：${relationship.endsAt}` : ''].filter(Boolean).join(' · ');
  return {
    relationship,
    otherType,
    otherTypeLabel: entityTypeLabel(otherType),
    otherName: other?.label ?? otherId,
    relationTypeLabel: relationshipTypeLabel(relationship.relationType),
    directionLabel,
    description: relationship.description ?? '',
    timeRange,
    currentLabel: relationship.isCurrent ? '当前有效' : '历史关系',
    canonLabel: statusLabel(relationship.canonStatus, '未标记'),
  };
}

function groupRowsByType(rows: RelationshipDisplayRow[]): Array<readonly [string, RelationshipDisplayRow[]]> {
  const grouped = new Map<string, RelationshipDisplayRow[]>();
  rows.forEach((row) => {
    const key = row.otherTypeLabel;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  });
  return [...grouped.entries()];
}

function relationshipTypeLabel(value?: string | null) {
  return allRelationshipTypeOptions().find((option) => option.value === value)?.label ?? value ?? '';
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

function ReadonlyRelationSummary({ groups, values }: { groups: DetailGroup[]; values: Record<string, unknown> }) {
  if (groups.length === 0) return null;
  return <section style={{ width: '100%', padding: '2px 0 14px', borderBottom: '1px solid var(--semi-color-border)' }}>
    <Title heading={5} style={{ margin: '0 0 10px' }}>关系摘要（只读）</Title>
    <GroupedDetails groups={groups} values={values} />
  </section>;
}

function GroupedDetails({ groups, values }: { groups: DetailGroup[]; values: Record<string, unknown> }) {
  return <div style={{ display: 'grid', gap: 16 }}>{groups.map((group) => <section key={group.title} style={{ width: '100%', padding: '2px 0 14px', borderBottom: '1px solid var(--semi-color-border)' }}><Title heading={5} style={{ margin: '0 0 10px' }}>{group.title}</Title><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', columnGap: 24, rowGap: 14 }}>{group.fields.map((field) => <DetailCard key={field.key} field={field} value={values[field.key]} />)}</div></section>)}</div>;
}

function DetailCard({ field, value }: { field: DetailField; value: unknown }) {
  const empty = isEmptyDisplayValue(value);
  const relation = isRelationField(field.key);
  const items = relationItems(value);
  const text = displayFieldValue(field, value);
  const shouldSpan = relation ? items.length > 2 : Boolean(field.long && !empty && text.length > 48);
  const statusLike = isStatusField(field.key) && !empty;

  return <div style={{ gridColumn: shouldSpan ? '1 / -1' : undefined, minWidth: 0, padding: shouldSpan ? '2px 0 8px' : '2px 0 6px' }}><Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 4, lineHeight: 1.35 }}>{field.label}</Text>{relation && items.length > 0 ? <Space wrap spacing={6} style={{ rowGap: 6 }}>{items.map((item) => <Tag key={item} size="small">{item}</Tag>)}</Space> : statusLike ? <Tag size="small" color={statusColor(String(value))}>{text}</Tag> : <Paragraph type={empty ? 'tertiary' : undefined} ellipsis={!shouldSpan ? { rows: 2, showTooltip: true } : undefined} style={{ whiteSpace: shouldSpan ? 'pre-wrap' : undefined, margin: 0, lineHeight: 1.55 }}>{text}</Paragraph>}</div>;
}

function isStatusField(fieldKey: string) {
  return fieldKey === 'status' || fieldKey === 'lifecycleStatus' || fieldKey === 'visibility' || fieldKey === 'canonStatus' || fieldKey === 'sourceType' || fieldKey === 'rarity' || fieldKey === 'lifeStatus';
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

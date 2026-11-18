import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateStoryItemDto } from './dto/create-story-item.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';
import { CreateStoryItemStateDto } from './dto/create-story-item-state.dto';
import { UpdateStoryItemStateDto } from './dto/update-story-item-state.dto';
import { CreateStoryItemRuleDto } from './dto/create-story-item-rule.dto';
import { UpdateStoryItemRuleDto } from './dto/update-story-item-rule.dto';

const itemOrderBy = [{ importance: 'desc' as const }, { orderIndex: 'asc' as const }, { updatedAt: 'desc' as const }];
const stateOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const latestStateOrderBy = [{ orderIndex: 'desc' as const }, { createdAt: 'desc' as const }];
const ruleOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];

type ItemData = Omit<UpdateStoryItemDto, never>;
type StateData = Omit<UpdateStoryItemStateDto, never>;
type RuleData = Omit<UpdateStoryItemRuleDto, never>;

function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) {
  const normalized: Record<string, unknown> = { ...data };
  for (const field of fields) if (field in normalized && typeof normalized[field] === 'string') normalized[field] = (normalized[field] as string).trim();
  return normalized as T;
}
function assertNonEmptyBody(dto: object | undefined) { if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty'); }
function assertNonNegativeInteger(value: number | undefined, field: string) { if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new BadRequestException(`${field} must be a non-negative integer`); }

@Injectable()
export class StoryItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async listStoryItems(projectId: string) { await this.ensureProject(projectId); return this.prisma.storyItem.findMany({ where: { projectId, deletedAt: null }, orderBy: itemOrderBy }); }
  async getStoryItem(projectId: string, storyItemId: string) {
    const storyItem = await this.prisma.storyItem.findFirst({ where: { id: storyItemId, projectId, deletedAt: null } });
    if (!storyItem) throw new NotFoundException(`StoryItem ${storyItemId} not found in project ${projectId}`);
    return storyItem;
  }
  async createStoryItem(projectId: string, dto: CreateStoryItemDto) {
    this.validateCreateItem(dto); await this.ensureProject(projectId); await this.ensureParentBoundary(projectId, dto.parentId);
    return this.prisma.storyItem.create({ data: { ...this.normalizeItemData(dto), name: dto.name.trim(), aliases: this.normalizeAliases(dto.aliases), projectId, canonStatus: 'draft' } });
  }
  async updateStoryItem(projectId: string, storyItemId: string, dto: UpdateStoryItemDto) {
    this.validateUpdateItem(dto); await this.getStoryItem(projectId, storyItemId); await this.ensureParentBoundary(projectId, dto.parentId ?? undefined, storyItemId);
    return this.prisma.storyItem.update({ where: { id: storyItemId }, data: { ...this.normalizeItemData(dto), aliases: dto.aliases === undefined ? undefined : this.normalizeAliases(dto.aliases) } });
  }
  async deleteStoryItem(projectId: string, storyItemId: string) { await this.getStoryItem(projectId, storyItemId); return this.prisma.storyItem.update({ where: { id: storyItemId }, data: { deletedAt: new Date() } }); }
  async confirmStoryItem(projectId: string, storyItemId: string) { await this.getStoryItem(projectId, storyItemId); return this.prisma.storyItem.update({ where: { id: storyItemId }, data: { canonStatus: 'confirmed' } }); }
  async archiveStoryItem(projectId: string, storyItemId: string) { await this.getStoryItem(projectId, storyItemId); return this.prisma.storyItem.update({ where: { id: storyItemId }, data: { canonStatus: 'archived' } }); }
  async getProfile(projectId: string, storyItemId: string) {
    const storyItem = await this.getStoryItem(projectId, storyItemId);
    const [latestState, rules] = await Promise.all([
      this.prisma.storyItemState.findFirst({ where: { projectId, storyItemId }, orderBy: latestStateOrderBy }),
      this.prisma.storyItemRule.findMany({ where: { projectId, storyItemId }, orderBy: ruleOrderBy }),
    ]);
    return { storyItem, latestState, rules };
  }

  async listStates(projectId: string, storyItemId: string) { await this.getStoryItem(projectId, storyItemId); return this.prisma.storyItemState.findMany({ where: { projectId, storyItemId }, orderBy: stateOrderBy }); }
  async getState(projectId: string, storyItemId: string, stateId: string) { await this.getStoryItem(projectId, storyItemId); const state = await this.prisma.storyItemState.findFirst({ where: { id: stateId, projectId, storyItemId } }); if (!state) throw new NotFoundException(`StoryItemState ${stateId} not found in story item ${storyItemId}`); return state; }
  async createState(projectId: string, storyItemId: string, dto: CreateStoryItemStateDto) { this.validateStateBody(dto, false); await this.getStoryItem(projectId, storyItemId); await this.ensureChapterBoundary(projectId, dto.chapterId); return this.prisma.storyItemState.create({ data: { ...this.normalizeStateData(dto), projectId, storyItemId } }); }
  async updateState(projectId: string, storyItemId: string, stateId: string, dto: UpdateStoryItemStateDto) { this.validateStateBody(dto, true); await this.getState(projectId, storyItemId, stateId); await this.ensureChapterBoundary(projectId, dto.chapterId ?? undefined); return this.prisma.storyItemState.update({ where: { id: stateId }, data: this.normalizeStateData(dto) }); }
  async deleteState(projectId: string, storyItemId: string, stateId: string) { await this.getState(projectId, storyItemId, stateId); return this.prisma.storyItemState.delete({ where: { id: stateId } }); }

  async listRules(projectId: string, storyItemId: string) { await this.getStoryItem(projectId, storyItemId); return this.prisma.storyItemRule.findMany({ where: { projectId, storyItemId }, orderBy: ruleOrderBy }); }
  async getRule(projectId: string, storyItemId: string, storyItemRuleId: string) { await this.getStoryItem(projectId, storyItemId); const rule = await this.prisma.storyItemRule.findFirst({ where: { id: storyItemRuleId, projectId, storyItemId } }); if (!rule) throw new NotFoundException(`StoryItemRule ${storyItemRuleId} not found in story item ${storyItemId}`); return rule; }
  async createRule(projectId: string, storyItemId: string, dto: CreateStoryItemRuleDto) { this.validateCreateRule(dto); await this.getStoryItem(projectId, storyItemId); await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId); return this.prisma.storyItemRule.create({ data: { ...this.normalizeRuleData(dto), worldRuleId: dto.worldRuleId.trim(), projectId, storyItemId } }); }
  async updateRule(projectId: string, storyItemId: string, storyItemRuleId: string, dto: UpdateStoryItemRuleDto) { this.validateUpdateRule(dto); await this.getRule(projectId, storyItemId, storyItemRuleId); await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId); return this.prisma.storyItemRule.update({ where: { id: storyItemRuleId }, data: this.normalizeRuleData(dto) }); }
  async deleteRule(projectId: string, storyItemId: string, storyItemRuleId: string) { await this.getRule(projectId, storyItemId, storyItemRuleId); return this.prisma.storyItemRule.delete({ where: { id: storyItemRuleId } }); }

  private async ensureProject(projectId: string) { const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } }); if (!project) throw new NotFoundException(`Project ${projectId} not found`); }
  private async ensureParentBoundary(projectId: string, parentId?: string | null, selfId?: string) { if (parentId === undefined || parentId === null) return; const id = parentId.trim(); if (!id) throw new BadRequestException('parentId cannot be empty'); if (id === selfId) throw new BadRequestException('parentId cannot be the story item itself'); const parent = await this.prisma.storyItem.findFirst({ where: { id, projectId, deletedAt: null }, select: { id: true } }); if (!parent) throw new BadRequestException('parentId must belong to the project'); }
  private async ensureChapterBoundary(projectId: string, chapterId?: string | null) { if (chapterId === undefined || chapterId === null) return; const id = chapterId.trim(); if (!id) throw new BadRequestException('chapterId cannot be empty'); const chapter = await this.prisma.chapter.findFirst({ where: { id, projectId, deletedAt: null }, select: { id: true } }); if (!chapter) throw new BadRequestException('chapterId must belong to the project'); }
  private async ensureWorldRuleBoundary(projectId: string, worldRuleId?: string | null) { if (worldRuleId === undefined || worldRuleId === null) return; const id = worldRuleId.trim(); if (!id) throw new BadRequestException('worldRuleId cannot be empty'); const worldRule = await this.prisma.worldRule.findFirst({ where: { id, projectId, deletedAt: null }, select: { id: true } }); if (!worldRule) throw new BadRequestException('worldRuleId must belong to the project'); }
  private validateCreateItem(dto: CreateStoryItemDto) { if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) throw new BadRequestException('name is required'); assertNonNegativeInteger(dto.importance, 'importance'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private validateUpdateItem(dto: UpdateStoryItemDto) { assertNonEmptyBody(dto); if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) throw new BadRequestException('name cannot be empty'); assertNonNegativeInteger(dto.importance, 'importance'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private validateStateBody(dto: CreateStoryItemStateDto | UpdateStoryItemStateDto, requireBody: boolean) { if (requireBody) assertNonEmptyBody(dto); assertNonNegativeInteger(dto?.orderIndex, 'orderIndex'); }
  private validateCreateRule(dto: CreateStoryItemRuleDto) { if (!dto || typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0) throw new BadRequestException('worldRuleId is required'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private validateUpdateRule(dto: UpdateStoryItemRuleDto) { assertNonEmptyBody(dto); if (dto.worldRuleId !== undefined && (typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0)) throw new BadRequestException('worldRuleId cannot be empty'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private normalizeItemData(data: ItemData) { return normalizeOptionalStrings(data, ['parentId', 'name', 'itemType', 'narrativeRole', 'summary', 'description', 'origin', 'appearance', 'function', 'effect', 'cost', 'limitation', 'owner', 'location', 'lifecycleStatus', 'visibility', 'sourceType', 'sourceId']); }
  private normalizeStateData(data: StateData) { return normalizeOptionalStrings(data, ['chapterId', 'stage', 'owner', 'location', 'lifecycleStatus', 'visibility', 'condition', 'powerState', 'eventSummary', 'stateNote', 'sourceType', 'sourceId']); }
  private normalizeRuleData(data: RuleData) { return normalizeOptionalStrings(data, ['worldRuleId', 'relationType', 'enforcementLevel', 'notes']); }
  private normalizeAliases(aliases: string[] | undefined) { return aliases?.map((alias) => alias.trim()).filter((alias) => alias.length > 0) ?? []; }
}

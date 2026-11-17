import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateFactionDto } from './dto/create-faction.dto';
import { UpdateFactionDto } from './dto/update-faction.dto';
import { ListFactionsQueryDto } from './dto/list-factions-query.dto';
import { CreateFactionStateDto } from './dto/create-faction-state.dto';
import { UpdateFactionStateDto } from './dto/update-faction-state.dto';
import { CreateFactionMembershipDto } from './dto/create-faction-membership.dto';
import { UpdateFactionMembershipDto } from './dto/update-faction-membership.dto';
import { CreateFactionRelationDto } from './dto/create-faction-relation.dto';
import { UpdateFactionRelationDto } from './dto/update-faction-relation.dto';
import { CreateFactionRuleDto } from './dto/create-faction-rule.dto';
import { UpdateFactionRuleDto } from './dto/update-faction-rule.dto';

const factionOrderBy = [{ importance: 'desc' as const }, { orderIndex: 'asc' as const }, { updatedAt: 'desc' as const }];
const stateOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const latestStateOrderBy = [{ orderIndex: 'desc' as const }, { createdAt: 'desc' as const }];
const membershipOrderBy = [{ createdAt: 'asc' as const }];
const relationOrderBy = [{ createdAt: 'asc' as const }];
const ruleOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const locationOrderBy = [{ createdAt: 'asc' as const }];

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

type FactionData = Omit<UpdateFactionDto, never>;
type StateData = Omit<UpdateFactionStateDto, never>;
type MembershipData = Omit<UpdateFactionMembershipDto, never>;
type RelationData = Omit<UpdateFactionRelationDto, never>;
type RuleData = Omit<UpdateFactionRuleDto, never>;

function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) {
  const normalized: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (field in normalized && typeof normalized[field] === 'string') {
      normalized[field] = (normalized[field] as string).trim();
    }
  }
  return normalized as T;
}

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) {
    throw new BadRequestException('request body cannot be empty');
  }
}

function assertNonNegativeInteger(value: number | undefined, field: string) {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
}

function parsePositiveInteger(value: string | undefined, fallback: number, field: string) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new BadRequestException(`${field} must be a positive integer`);
  }
  return parsed;
}

@Injectable()
export class FactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFactions(projectId: string, query: ListFactionsQueryDto = {}) {
    await this.ensureProject(projectId);
    const { page, pageSize, skip, take } = this.parsePagination(query);
    const where = this.buildFactionListWhere(projectId, query);
    const [items, total] = await Promise.all([
      this.prisma.faction.findMany({
        where,
        orderBy: factionOrderBy,
        skip,
        take,
      }),
      this.prisma.faction.count({ where }),
    ]);

    return { items, page, pageSize, total };
  }

  async getFaction(projectId: string, factionId: string) {
    const faction = await this.prisma.faction.findFirst({ where: { id: factionId, projectId, deletedAt: null } });

    if (!faction) {
      throw new NotFoundException(`Faction ${factionId} not found in project ${projectId}`);
    }

    return faction;
  }

  async createFaction(projectId: string, dto: CreateFactionDto) {
    this.validateCreateFaction(dto);
    await this.ensureProject(projectId);
    await this.ensureParentFactionBoundary(projectId, dto.parentId);

    return this.prisma.faction.create({
      data: {
        ...this.normalizeFactionData(dto),
        name: dto.name.trim(),
        aliases: this.normalizeAliases(dto.aliases),
        projectId,
        canonStatus: 'draft',
      },
    });
  }

  async updateFaction(projectId: string, factionId: string, dto: UpdateFactionDto) {
    this.validateUpdateFaction(dto);
    await this.getFaction(projectId, factionId);
    await this.ensureParentFactionBoundary(projectId, dto.parentId ?? undefined, factionId);

    return this.prisma.faction.update({
      where: { id: factionId },
      data: {
        ...this.normalizeFactionData(dto),
        aliases: dto.aliases === undefined ? undefined : this.normalizeAliases(dto.aliases),
      },
    });
  }

  async deleteFaction(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.faction.update({ where: { id: factionId }, data: { deletedAt: new Date() } });
  }

  async confirmFaction(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.faction.update({ where: { id: factionId }, data: { canonStatus: 'confirmed' } });
  }

  async archiveFaction(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.faction.update({ where: { id: factionId }, data: { canonStatus: 'archived' } });
  }

  async getProfile(projectId: string, factionId: string) {
    const faction = await this.getFaction(projectId, factionId);
    const [latestState, memberships, relations, rules, locations] = await Promise.all([
      this.prisma.factionState.findFirst({ where: { projectId, factionId }, orderBy: latestStateOrderBy }),
      this.prisma.factionMembership.findMany({ where: { projectId, factionId, deletedAt: null }, orderBy: membershipOrderBy }),
      this.prisma.factionRelation.findMany({
        where: { projectId, deletedAt: null, OR: [{ sourceFactionId: factionId }, { targetFactionId: factionId }] },
        orderBy: relationOrderBy,
      }),
      this.prisma.factionRule.findMany({ where: { projectId, factionId }, orderBy: ruleOrderBy }),
      this.prisma.locationFaction.findMany({ where: { projectId, factionId, deletedAt: null }, orderBy: locationOrderBy }),
    ]);

    return { faction, latestState, memberships, relations, rules, locations };
  }

  async listStates(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.factionState.findMany({ where: { projectId, factionId }, orderBy: stateOrderBy });
  }

  async getState(projectId: string, factionId: string, stateId: string) {
    await this.getFaction(projectId, factionId);
    const state = await this.prisma.factionState.findFirst({ where: { id: stateId, projectId, factionId } });

    if (!state) {
      throw new NotFoundException(`FactionState ${stateId} not found in faction ${factionId}`);
    }

    return state;
  }

  async createState(projectId: string, factionId: string, dto: CreateFactionStateDto) {
    this.validateStateBody(dto, false);
    await this.getFaction(projectId, factionId);
    await this.ensureChapterBoundary(projectId, dto.chapterId);

    return this.prisma.factionState.create({
      data: {
        ...this.normalizeStateData(dto),
        projectId,
        factionId,
      },
    });
  }

  async updateState(projectId: string, factionId: string, stateId: string, dto: UpdateFactionStateDto) {
    this.validateStateBody(dto, true);
    await this.getState(projectId, factionId, stateId);
    await this.ensureChapterBoundary(projectId, dto.chapterId ?? undefined);

    return this.prisma.factionState.update({ where: { id: stateId }, data: this.normalizeStateData(dto) });
  }

  async deleteState(projectId: string, factionId: string, stateId: string) {
    await this.getState(projectId, factionId, stateId);

    // FactionState has no deletedAt in the current Prisma schema, so deletion is physical.
    return this.prisma.factionState.delete({ where: { id: stateId } });
  }

  async listMemberships(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.factionMembership.findMany({ where: { projectId, factionId, deletedAt: null }, orderBy: membershipOrderBy });
  }

  async getMembership(projectId: string, factionId: string, membershipId: string) {
    await this.getFaction(projectId, factionId);
    const membership = await this.prisma.factionMembership.findFirst({ where: { id: membershipId, projectId, factionId, deletedAt: null } });

    if (!membership) {
      throw new NotFoundException(`FactionMembership ${membershipId} not found in faction ${factionId}`);
    }

    return membership;
  }

  async createMembership(projectId: string, factionId: string, dto: CreateFactionMembershipDto) {
    this.validateCreateMembership(dto);
    await this.getFaction(projectId, factionId);
    await this.ensureCharacterBoundary(projectId, dto.characterId);

    return this.prisma.factionMembership.create({
      data: {
        ...this.normalizeMembershipData(dto),
        characterId: dto.characterId.trim(),
        projectId,
        factionId,
        isCurrent: dto.isCurrent ?? true,
        isPublic: dto.isPublic ?? true,
        canonStatus: 'draft',
      },
    });
  }

  async updateMembership(projectId: string, factionId: string, membershipId: string, dto: UpdateFactionMembershipDto) {
    this.validateUpdateMembership(dto);
    await this.getMembership(projectId, factionId, membershipId);
    await this.ensureCharacterBoundary(projectId, dto.characterId);

    return this.prisma.factionMembership.update({ where: { id: membershipId }, data: this.normalizeMembershipData(dto) });
  }

  async deleteMembership(projectId: string, factionId: string, membershipId: string) {
    await this.getMembership(projectId, factionId, membershipId);

    return this.prisma.factionMembership.update({ where: { id: membershipId }, data: { deletedAt: new Date() } });
  }

  async listRelations(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.factionRelation.findMany({ where: { projectId, sourceFactionId: factionId, deletedAt: null }, orderBy: relationOrderBy });
  }

  async getRelation(projectId: string, factionId: string, relationId: string) {
    await this.getFaction(projectId, factionId);
    const relation = await this.prisma.factionRelation.findFirst({ where: { id: relationId, projectId, sourceFactionId: factionId, deletedAt: null } });

    if (!relation) {
      throw new NotFoundException(`FactionRelation ${relationId} not found in faction ${factionId}`);
    }

    return relation;
  }

  async createRelation(projectId: string, factionId: string, dto: CreateFactionRelationDto) {
    this.validateCreateRelation(dto);
    await this.getFaction(projectId, factionId);
    if (dto.targetFactionId.trim() === factionId) {
      throw new BadRequestException('targetFactionId cannot be the source faction itself');
    }
    await this.ensureFactionBoundary(projectId, dto.targetFactionId, 'targetFactionId');

    return this.prisma.factionRelation.create({
      data: {
        ...this.normalizeRelationData(dto),
        targetFactionId: dto.targetFactionId.trim(),
        sourceFactionId: factionId,
        projectId,
        isCurrent: dto.isCurrent ?? true,
        canonStatus: 'draft',
      },
    });
  }

  async updateRelation(projectId: string, factionId: string, relationId: string, dto: UpdateFactionRelationDto) {
    this.validateUpdateRelation(dto);
    await this.getRelation(projectId, factionId, relationId);
    if (dto.targetFactionId !== undefined && dto.targetFactionId.trim() === factionId) {
      throw new BadRequestException('targetFactionId cannot be the source faction itself');
    }
    await this.ensureFactionBoundary(projectId, dto.targetFactionId, 'targetFactionId');

    return this.prisma.factionRelation.update({ where: { id: relationId }, data: this.normalizeRelationData(dto) });
  }

  async deleteRelation(projectId: string, factionId: string, relationId: string) {
    await this.getRelation(projectId, factionId, relationId);

    return this.prisma.factionRelation.update({ where: { id: relationId }, data: { deletedAt: new Date() } });
  }

  async listRules(projectId: string, factionId: string) {
    await this.getFaction(projectId, factionId);

    return this.prisma.factionRule.findMany({ where: { projectId, factionId }, orderBy: ruleOrderBy });
  }

  async getRule(projectId: string, factionId: string, factionRuleId: string) {
    await this.getFaction(projectId, factionId);
    const factionRule = await this.prisma.factionRule.findFirst({ where: { id: factionRuleId, projectId, factionId } });

    if (!factionRule) {
      throw new NotFoundException(`FactionRule ${factionRuleId} not found in faction ${factionId}`);
    }

    return factionRule;
  }

  async createRule(projectId: string, factionId: string, dto: CreateFactionRuleDto) {
    this.validateCreateRule(dto);
    await this.getFaction(projectId, factionId);
    await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId);

    return this.prisma.factionRule.create({
      data: {
        ...this.normalizeRuleData(dto),
        worldRuleId: dto.worldRuleId.trim(),
        projectId,
        factionId,
      },
    });
  }

  async updateRule(projectId: string, factionId: string, factionRuleId: string, dto: UpdateFactionRuleDto) {
    this.validateUpdateRule(dto);
    await this.getRule(projectId, factionId, factionRuleId);
    await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId);

    return this.prisma.factionRule.update({ where: { id: factionRuleId }, data: this.normalizeRuleData(dto) });
  }

  async deleteRule(projectId: string, factionId: string, factionRuleId: string) {
    await this.getRule(projectId, factionId, factionRuleId);

    // FactionRule has no deletedAt in the current Prisma schema, so deletion is physical.
    return this.prisma.factionRule.delete({ where: { id: factionRuleId } });
  }

  private buildFactionListWhere(projectId: string, query: ListFactionsQueryDto) {
    const where: Record<string, unknown> = { projectId, deletedAt: null };
    if (query.canonStatus) where.canonStatus = query.canonStatus.trim();
    if (query.status) where.status = query.status.trim();
    if (query.factionType) where.factionType = query.factionType.trim();
    if (query.narrativeRole) where.narrativeRole = query.narrativeRole.trim();
    if (query.parentId) {
      const parentId = query.parentId.trim();
      where.parentId = parentId === 'null' ? null : parentId;
    }
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { summary: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { ideology: { contains: keyword, mode: 'insensitive' } },
        { goal: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private parsePagination(query: ListFactionsQueryDto) {
    const page = parsePositiveInteger(query.page, DEFAULT_PAGE, 'page');
    const requestedPageSize = parsePositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize');
    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private async ensureParentFactionBoundary(projectId: string, parentId?: string | null, selfId?: string) {
    if (parentId === undefined || parentId === null) return;
    const normalizedParentId = parentId.trim();
    if (!normalizedParentId) {
      throw new BadRequestException('parentId cannot be empty');
    }
    if (normalizedParentId === selfId) {
      throw new BadRequestException('parentId cannot be the faction itself');
    }
    const parent = await this.prisma.faction.findFirst({ where: { id: normalizedParentId, projectId, deletedAt: null }, select: { id: true } });
    if (!parent) {
      throw new BadRequestException('parentId must belong to the project');
    }
  }

  private async ensureFactionBoundary(projectId: string, factionId?: string | null, field = 'factionId') {
    if (factionId === undefined || factionId === null) return;
    const normalizedFactionId = factionId.trim();
    if (!normalizedFactionId) {
      throw new BadRequestException(`${field} cannot be empty`);
    }
    const faction = await this.prisma.faction.findFirst({ where: { id: normalizedFactionId, projectId, deletedAt: null }, select: { id: true } });
    if (!faction) {
      throw new BadRequestException(`${field} must belong to the project`);
    }
  }

  private async ensureCharacterBoundary(projectId: string, characterId?: string | null) {
    if (characterId === undefined || characterId === null) return;
    const normalizedCharacterId = characterId.trim();
    if (!normalizedCharacterId) {
      throw new BadRequestException('characterId cannot be empty');
    }
    const character = await this.prisma.character.findFirst({ where: { id: normalizedCharacterId, projectId, deletedAt: null }, select: { id: true } });
    if (!character) {
      throw new BadRequestException('characterId must belong to the project');
    }
  }

  private async ensureWorldRuleBoundary(projectId: string, worldRuleId?: string | null) {
    if (worldRuleId === undefined || worldRuleId === null) return;
    const normalizedWorldRuleId = worldRuleId.trim();
    if (!normalizedWorldRuleId) {
      throw new BadRequestException('worldRuleId cannot be empty');
    }
    const worldRule = await this.prisma.worldRule.findFirst({ where: { id: normalizedWorldRuleId, projectId, deletedAt: null }, select: { id: true } });
    if (!worldRule) {
      throw new BadRequestException('worldRuleId must belong to the project');
    }
  }

  private async ensureChapterBoundary(projectId: string, chapterId?: string | null) {
    if (chapterId === undefined || chapterId === null) return;
    const normalizedChapterId = chapterId.trim();
    if (!normalizedChapterId) {
      throw new BadRequestException('chapterId cannot be empty');
    }
    const chapter = await this.prisma.chapter.findFirst({ where: { id: normalizedChapterId, projectId, deletedAt: null }, select: { id: true } });
    if (!chapter) {
      throw new BadRequestException('chapterId must belong to the project');
    }
  }

  private validateCreateFaction(dto: CreateFactionDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateUpdateFaction(dto: UpdateFactionDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new BadRequestException('name cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateStateBody(dto: CreateFactionStateDto | UpdateFactionStateDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
  }

  private validateCreateMembership(dto: CreateFactionMembershipDto) {
    if (!dto || typeof dto.characterId !== 'string' || dto.characterId.trim().length === 0) {
      throw new BadRequestException('characterId is required');
    }
  }

  private validateUpdateMembership(dto: UpdateFactionMembershipDto) {
    assertNonEmptyBody(dto);
    if (dto.characterId !== undefined && (typeof dto.characterId !== 'string' || dto.characterId.trim().length === 0)) {
      throw new BadRequestException('characterId cannot be empty');
    }
  }

  private validateCreateRelation(dto: CreateFactionRelationDto) {
    if (!dto || typeof dto.targetFactionId !== 'string' || dto.targetFactionId.trim().length === 0) {
      throw new BadRequestException('targetFactionId is required');
    }
  }

  private validateUpdateRelation(dto: UpdateFactionRelationDto) {
    assertNonEmptyBody(dto);
    if (dto.targetFactionId !== undefined && (typeof dto.targetFactionId !== 'string' || dto.targetFactionId.trim().length === 0)) {
      throw new BadRequestException('targetFactionId cannot be empty');
    }
  }

  private validateCreateRule(dto: CreateFactionRuleDto) {
    if (!dto || typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0) {
      throw new BadRequestException('worldRuleId is required');
    }
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateUpdateRule(dto: UpdateFactionRuleDto) {
    assertNonEmptyBody(dto);
    if (dto.worldRuleId !== undefined && (typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0)) {
      throw new BadRequestException('worldRuleId cannot be empty');
    }
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private normalizeFactionData(data: FactionData) {
    return normalizeOptionalStrings(data, [
      'parentId',
      'name',
      'factionType',
      'narrativeRole',
      'summary',
      'description',
      'ideology',
      'goal',
      'structure',
      'resources',
      'status',
      'visibility',
      'sourceType',
      'sourceId',
    ]);
  }

  private normalizeStateData(data: StateData) {
    return normalizeOptionalStrings(data, [
      'chapterId',
      'stage',
      'status',
      'powerLevel',
      'influenceLevel',
      'resourceState',
      'internalState',
      'publicReputation',
      'goal',
      'conflictSummary',
      'eventSummary',
      'stateNote',
      'sourceType',
      'sourceId',
    ]);
  }

  private normalizeMembershipData(data: MembershipData) {
    return normalizeOptionalStrings(data, ['characterId', 'membershipType', 'roleTitle', 'rank', 'department', 'startsAt', 'endsAt', 'notes', 'sourceType', 'sourceId']);
  }

  private normalizeRelationData(data: RelationData) {
    return normalizeOptionalStrings(data, ['targetFactionId', 'relationType', 'direction', 'strength', 'startsAt', 'endsAt', 'description', 'sourceType', 'sourceId']);
  }

  private normalizeRuleData(data: RuleData) {
    return normalizeOptionalStrings(data, ['worldRuleId', 'relationType', 'enforcementLevel', 'notes']);
  }

  private normalizeAliases(aliases: string[] | undefined) {
    return aliases?.map((alias) => alias.trim()).filter((alias) => alias.length > 0) ?? [];
  }
}

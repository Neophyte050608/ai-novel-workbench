import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { CreateLocationStateDto } from './dto/create-location-state.dto';
import { UpdateLocationStateDto } from './dto/update-location-state.dto';
import { CreateLocationRuleDto } from './dto/create-location-rule.dto';
import { UpdateLocationRuleDto } from './dto/update-location-rule.dto';
import { CreateLocationFactionDto } from './dto/create-location-faction.dto';
import { UpdateLocationFactionDto } from './dto/update-location-faction.dto';

const locationOrderBy = [{ importance: 'desc' as const }, { orderIndex: 'asc' as const }, { updatedAt: 'desc' as const }];
const stateOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const latestStateOrderBy = [{ orderIndex: 'desc' as const }, { createdAt: 'desc' as const }];
const ruleOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const factionOrderBy = [{ createdAt: 'asc' as const }];

type LocationData = Omit<UpdateLocationDto, never>;
type StateData = Omit<UpdateLocationStateDto, never>;
type RuleData = Omit<UpdateLocationRuleDto, never>;
type FactionData = Omit<UpdateLocationFactionDto, never>;

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

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listLocations(projectId: string) {
    await this.ensureProject(projectId);

    return this.prisma.location.findMany({
      where: { projectId, deletedAt: null },
      orderBy: locationOrderBy,
    });
  }

  async getLocation(projectId: string, locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, projectId, deletedAt: null },
    });

    if (!location) {
      throw new NotFoundException(`Location ${locationId} not found in project ${projectId}`);
    }

    return location;
  }

  async createLocation(projectId: string, dto: CreateLocationDto) {
    this.validateCreateLocation(dto);
    await this.ensureProject(projectId);
    await this.ensureParentLocationBoundary(projectId, dto.parentId);

    return this.prisma.location.create({
      data: {
        ...this.normalizeLocationData(dto),
        name: dto.name.trim(),
        aliases: this.normalizeAliases(dto.aliases),
        projectId,
        canonStatus: 'draft',
      },
    });
  }

  async updateLocation(projectId: string, locationId: string, dto: UpdateLocationDto) {
    this.validateUpdateLocation(dto);
    await this.getLocation(projectId, locationId);
    await this.ensureParentLocationBoundary(projectId, dto.parentId ?? undefined, locationId);

    return this.prisma.location.update({
      where: { id: locationId },
      data: {
        ...this.normalizeLocationData(dto),
        aliases: dto.aliases === undefined ? undefined : this.normalizeAliases(dto.aliases),
      },
    });
  }

  async deleteLocation(projectId: string, locationId: string) {
    await this.getLocation(projectId, locationId);

    return this.prisma.location.update({
      where: { id: locationId },
      data: { deletedAt: new Date() },
    });
  }

  async confirmLocation(projectId: string, locationId: string) {
    await this.getLocation(projectId, locationId);

    return this.prisma.location.update({ where: { id: locationId }, data: { canonStatus: 'confirmed' } });
  }

  async archiveLocation(projectId: string, locationId: string) {
    await this.getLocation(projectId, locationId);

    return this.prisma.location.update({ where: { id: locationId }, data: { canonStatus: 'archived' } });
  }

  async getProfile(projectId: string, locationId: string) {
    const location = await this.getLocation(projectId, locationId);
    const [latestState, rules, factions] = await Promise.all([
      this.prisma.locationState.findFirst({ where: { projectId, locationId }, orderBy: latestStateOrderBy }),
      this.prisma.locationRule.findMany({ where: { projectId, locationId }, orderBy: ruleOrderBy }),
      this.prisma.locationFaction.findMany({ where: { projectId, locationId, deletedAt: null, isCurrent: true }, orderBy: factionOrderBy }),
    ]);

    return { location, latestState, rules, factions };
  }

  async listStates(projectId: string, locationId: string) {
    await this.getLocation(projectId, locationId);

    return this.prisma.locationState.findMany({ where: { projectId, locationId }, orderBy: stateOrderBy });
  }

  async getState(projectId: string, locationId: string, stateId: string) {
    await this.getLocation(projectId, locationId);
    const state = await this.prisma.locationState.findFirst({ where: { id: stateId, projectId, locationId } });

    if (!state) {
      throw new NotFoundException(`LocationState ${stateId} not found in location ${locationId}`);
    }

    return state;
  }

  async createState(projectId: string, locationId: string, dto: CreateLocationStateDto) {
    this.validateStateBody(dto, false);
    await this.getLocation(projectId, locationId);
    await this.ensureChapterBoundary(projectId, dto.chapterId);

    return this.prisma.locationState.create({
      data: {
        ...this.normalizeStateData(dto),
        projectId,
        locationId,
      },
    });
  }

  async updateState(projectId: string, locationId: string, stateId: string, dto: UpdateLocationStateDto) {
    this.validateStateBody(dto, true);
    await this.getState(projectId, locationId, stateId);
    await this.ensureChapterBoundary(projectId, dto.chapterId ?? undefined);

    return this.prisma.locationState.update({ where: { id: stateId }, data: this.normalizeStateData(dto) });
  }

  async deleteState(projectId: string, locationId: string, stateId: string) {
    await this.getState(projectId, locationId, stateId);

    return this.prisma.locationState.delete({ where: { id: stateId } });
  }

  async listRules(projectId: string, locationId: string) {
    await this.getLocation(projectId, locationId);

    return this.prisma.locationRule.findMany({ where: { projectId, locationId }, orderBy: ruleOrderBy });
  }

  async getRule(projectId: string, locationId: string, locationRuleId: string) {
    await this.getLocation(projectId, locationId);
    const locationRule = await this.prisma.locationRule.findFirst({ where: { id: locationRuleId, projectId, locationId } });

    if (!locationRule) {
      throw new NotFoundException(`LocationRule ${locationRuleId} not found in location ${locationId}`);
    }

    return locationRule;
  }

  async createRule(projectId: string, locationId: string, dto: CreateLocationRuleDto) {
    this.validateCreateRule(dto);
    await this.getLocation(projectId, locationId);
    await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId);

    return this.prisma.locationRule.create({
      data: {
        ...this.normalizeRuleData(dto),
        worldRuleId: dto.worldRuleId.trim(),
        projectId,
        locationId,
      },
    });
  }

  async updateRule(projectId: string, locationId: string, locationRuleId: string, dto: UpdateLocationRuleDto) {
    this.validateUpdateRule(dto);
    await this.getRule(projectId, locationId, locationRuleId);
    await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId);

    return this.prisma.locationRule.update({ where: { id: locationRuleId }, data: this.normalizeRuleData(dto) });
  }

  async deleteRule(projectId: string, locationId: string, locationRuleId: string) {
    await this.getRule(projectId, locationId, locationRuleId);

    return this.prisma.locationRule.delete({ where: { id: locationRuleId } });
  }

  async listFactions(projectId: string, locationId: string) {
    await this.getLocation(projectId, locationId);

    return this.prisma.locationFaction.findMany({ where: { projectId, locationId, deletedAt: null }, orderBy: factionOrderBy });
  }

  async getFaction(projectId: string, locationId: string, locationFactionId: string) {
    await this.getLocation(projectId, locationId);
    const locationFaction = await this.prisma.locationFaction.findFirst({ where: { id: locationFactionId, projectId, locationId, deletedAt: null } });

    if (!locationFaction) {
      throw new NotFoundException(`LocationFaction ${locationFactionId} not found in location ${locationId}`);
    }

    return locationFaction;
  }

  async createFaction(projectId: string, locationId: string, dto: CreateLocationFactionDto) {
    this.validateCreateFaction(dto);
    await this.getLocation(projectId, locationId);
    await this.ensureFactionBoundary(projectId, dto.factionId);

    return this.prisma.locationFaction.create({
      data: {
        ...this.normalizeFactionData(dto),
        factionId: dto.factionId.trim(),
        projectId,
        locationId,
        isCurrent: dto.isCurrent ?? true,
        canonStatus: 'draft',
      },
    });
  }

  async updateFaction(projectId: string, locationId: string, locationFactionId: string, dto: UpdateLocationFactionDto) {
    this.validateUpdateFaction(dto);
    await this.getFaction(projectId, locationId, locationFactionId);
    await this.ensureFactionBoundary(projectId, dto.factionId);

    return this.prisma.locationFaction.update({ where: { id: locationFactionId }, data: this.normalizeFactionData(dto) });
  }

  async deleteFaction(projectId: string, locationId: string, locationFactionId: string) {
    await this.getFaction(projectId, locationId, locationFactionId);

    return this.prisma.locationFaction.update({ where: { id: locationFactionId }, data: { deletedAt: new Date() } });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private async ensureParentLocationBoundary(projectId: string, parentId?: string | null, selfId?: string) {
    if (parentId === undefined || parentId === null) return;
    const normalizedParentId = parentId.trim();
    if (!normalizedParentId) {
      throw new BadRequestException('parentId cannot be empty');
    }
    if (normalizedParentId === selfId) {
      throw new BadRequestException('parentId cannot be the location itself');
    }
    const parent = await this.prisma.location.findFirst({ where: { id: normalizedParentId, projectId, deletedAt: null }, select: { id: true } });
    if (!parent) {
      throw new BadRequestException('parentId must belong to the project');
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

  private async ensureFactionBoundary(projectId: string, factionId?: string | null) {
    if (factionId === undefined || factionId === null) return;
    const normalizedFactionId = factionId.trim();
    if (!normalizedFactionId) {
      throw new BadRequestException('factionId cannot be empty');
    }
    const faction = await this.prisma.faction.findFirst({ where: { id: normalizedFactionId, projectId, deletedAt: null }, select: { id: true } });
    if (!faction) {
      throw new BadRequestException('factionId must belong to the project');
    }
  }

  private validateCreateLocation(dto: CreateLocationDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateUpdateLocation(dto: UpdateLocationDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new BadRequestException('name cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateStateBody(dto: CreateLocationStateDto | UpdateLocationStateDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
  }

  private validateCreateRule(dto: CreateLocationRuleDto) {
    if (!dto || typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0) {
      throw new BadRequestException('worldRuleId is required');
    }
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateUpdateRule(dto: UpdateLocationRuleDto) {
    assertNonEmptyBody(dto);
    if (dto.worldRuleId !== undefined && (typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0)) {
      throw new BadRequestException('worldRuleId cannot be empty');
    }
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateCreateFaction(dto: CreateLocationFactionDto) {
    if (!dto || typeof dto.factionId !== 'string' || dto.factionId.trim().length === 0) {
      throw new BadRequestException('factionId is required');
    }
  }

  private validateUpdateFaction(dto: UpdateLocationFactionDto) {
    assertNonEmptyBody(dto);
    if (dto.factionId !== undefined && (typeof dto.factionId !== 'string' || dto.factionId.trim().length === 0)) {
      throw new BadRequestException('factionId cannot be empty');
    }
  }

  private normalizeLocationData(data: LocationData) {
    return normalizeOptionalStrings(data, [
      'parentId',
      'name',
      'locationType',
      'narrativeRole',
      'summary',
      'description',
      'environment',
      'atmosphere',
      'terrain',
      'climate',
      'accessRule',
      'dangerLevel',
      'lifecycleStatus',
      'visibility',
      'sourceType',
      'sourceId',
    ]);
  }

  private normalizeStateData(data: StateData) {
    return normalizeOptionalStrings(data, [
      'chapterId',
      'stage',
      'lifecycleStatus',
      'dangerLevel',
      'accessRule',
      'visibility',
      'environmentChanges',
      'controlSummary',
      'eventSummary',
      'stateNote',
      'sourceType',
      'sourceId',
    ]);
  }

  private normalizeRuleData(data: RuleData) {
    return normalizeOptionalStrings(data, ['worldRuleId', 'relationType', 'enforcementLevel', 'notes']);
  }

  private normalizeFactionData(data: FactionData) {
    return normalizeOptionalStrings(data, ['factionId', 'relationType', 'influenceLevel', 'startsAt', 'endsAt', 'notes', 'sourceType', 'sourceId']);
  }

  private normalizeAliases(aliases: string[] | undefined) {
    return aliases?.map((alias) => alias.trim()).filter((alias) => alias.length > 0) ?? [];
  }
}

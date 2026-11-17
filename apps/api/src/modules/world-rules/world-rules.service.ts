import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateWorldRuleDto } from './dto/create-world-rule.dto';
import { UpdateWorldRuleDto } from './dto/update-world-rule.dto';

const worldRuleOrderBy = [{ importance: 'desc' as const }, { updatedAt: 'desc' as const }];
const relationOrderBy = [{ isPrimary: 'desc' as const }, { orderIndex: 'asc' as const }, { updatedAt: 'desc' as const }];

type WorldRuleData = Omit<UpdateWorldRuleDto, never>;

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
export class WorldRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async listWorldRules(projectId: string) {
    await this.ensureProject(projectId);

    return this.prisma.worldRule.findMany({
      where: { projectId, deletedAt: null },
      orderBy: worldRuleOrderBy,
    });
  }

  async getWorldRule(projectId: string, worldRuleId: string) {
    const worldRule = await this.prisma.worldRule.findFirst({
      where: { id: worldRuleId, projectId, deletedAt: null },
    });

    if (!worldRule) {
      throw new NotFoundException(`WorldRule ${worldRuleId} not found in project ${projectId}`);
    }

    return worldRule;
  }

  async getProfile(projectId: string, worldRuleId: string) {
    const worldRule = await this.getWorldRule(projectId, worldRuleId);
    const [locations, factions, species] = await Promise.all([
      this.prisma.locationRule.findMany({ where: { projectId, worldRuleId }, orderBy: relationOrderBy }),
      this.prisma.factionRule.findMany({ where: { projectId, worldRuleId }, orderBy: relationOrderBy }),
      this.prisma.speciesRule.findMany({ where: { projectId, worldRuleId }, orderBy: relationOrderBy }),
    ]);

    return { worldRule, rule: worldRule, locations, factions, species };
  }

  async createWorldRule(projectId: string, dto: CreateWorldRuleDto) {
    this.validateCreateWorldRule(dto);
    await this.ensureProject(projectId);

    return this.prisma.worldRule.create({
      data: {
        ...this.normalizeWorldRuleData(dto),
        title: dto.title.trim(),
        projectId,
        canonStatus: 'draft',
        status: dto.status?.trim() || 'active',
        priority: dto.priority?.trim() || 'medium',
      },
    });
  }

  async updateWorldRule(projectId: string, worldRuleId: string, dto: UpdateWorldRuleDto) {
    this.validateUpdateWorldRule(dto);
    await this.getWorldRule(projectId, worldRuleId);

    return this.prisma.worldRule.update({
      where: { id: worldRuleId },
      data: this.normalizeWorldRuleData(dto),
    });
  }

  async deleteWorldRule(projectId: string, worldRuleId: string) {
    await this.getWorldRule(projectId, worldRuleId);

    return this.prisma.worldRule.update({
      where: { id: worldRuleId },
      data: { deletedAt: new Date() },
    });
  }

  async confirmWorldRule(projectId: string, worldRuleId: string) {
    await this.getWorldRule(projectId, worldRuleId);

    return this.prisma.worldRule.update({
      where: { id: worldRuleId },
      data: { canonStatus: 'confirmed' },
    });
  }

  async archiveWorldRule(projectId: string, worldRuleId: string) {
    await this.getWorldRule(projectId, worldRuleId);

    return this.prisma.worldRule.update({
      where: { id: worldRuleId },
      data: { canonStatus: 'archived' },
    });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private validateCreateWorldRule(dto: CreateWorldRuleDto) {
    if (!dto || typeof dto.title !== 'string' || dto.title.trim().length === 0) {
      throw new BadRequestException('title is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateUpdateWorldRule(dto: UpdateWorldRuleDto) {
    assertNonEmptyBody(dto);
    if (dto.title !== undefined && (typeof dto.title !== 'string' || dto.title.trim().length === 0)) {
      throw new BadRequestException('title cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private normalizeWorldRuleData(data: WorldRuleData) {
    return normalizeOptionalStrings(data, [
      'title',
      'summary',
      'content',
      'ruleType',
      'category',
      'priority',
      'status',
      'condition',
      'effect',
      'cost',
      'exception',
      'violationConsequence',
      'visibility',
      'sourceType',
      'sourceId',
    ]);
  }
}

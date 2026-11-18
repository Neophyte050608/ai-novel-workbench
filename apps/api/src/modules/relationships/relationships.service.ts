import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CanonStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { ListRelationshipsQueryDto } from './dto/list-relationships-query.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const relationshipOrderBy = [{ importance: 'desc' as const }, { updatedAt: 'desc' as const }];
const allowedCanonStatuses = new Set(['draft', 'confirmed', 'archived']);
const allowedDirections = new Set(['directed', 'bidirectional']);

const entityModelByType = {
  character: 'character',
  location: 'location',
  faction: 'faction',
  species: 'species',
  story_item: 'storyItem',
  ability: 'ability',
  world_rule: 'worldRule',
  world_item: 'worldItem',
  chapter: 'chapter',
  chapter_plan: 'chapterPlan',
} as const;

type RelationshipEntityType = keyof typeof entityModelByType;
type RelationshipData = Omit<UpdateRelationshipDto, never>;

type RelationshipEndpoint = {
  sourceType: RelationshipEntityType;
  sourceId: string;
  targetType: RelationshipEntityType;
  targetId: string;
};

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty');
}

function assertNonNegativeInteger(value: number | undefined, field: string) {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new BadRequestException(`${field} must be a non-negative integer`);
}

function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) {
  const normalized: Record<string, unknown> = { ...data };
  for (const field of fields) if (field in normalized && typeof normalized[field] === 'string') normalized[field] = (normalized[field] as string).trim();
  return normalized as T;
}

function parsePositiveInteger(value: string | number | undefined, fallback: number, field: string) {
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new BadRequestException(`${field} must be a positive integer`);
  return parsed;
}

function parseOptionalBoolean(value: string | boolean | undefined, field: string) {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new BadRequestException(`${field} must be true or false`);
}

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRelationships(projectId: string, query: ListRelationshipsQueryDto = {}) {
    await this.ensureProject(projectId);
    const { page, pageSize, skip, take } = this.parsePagination(query);
    const where = this.buildListWhere(projectId, query);
    if (query.entityType !== undefined || query.entityId !== undefined) {
      await this.ensureEndpointBoundary(projectId, this.parseEntityType(query.entityType, 'entityType'), this.parseRequiredString(query.entityId, 'entityId'));
    }
    const [items, total] = await Promise.all([
      this.prisma.relationship.findMany({ where, orderBy: relationshipOrderBy, skip, take }),
      this.prisma.relationship.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  async getRelationship(projectId: string, relationshipId: string) {
    const relationship = await this.prisma.relationship.findFirst({ where: { id: relationshipId, projectId, deletedAt: null } });
    if (!relationship) throw new NotFoundException(`Relationship ${relationshipId} not found in project ${projectId}`);
    return relationship;
  }

  async createRelationship(projectId: string, dto: CreateRelationshipDto) {
    this.validateCreate(dto);
    await this.ensureProject(projectId);
    const endpoints = this.getCreateEndpoints(dto);
    await this.ensureEndpointBoundary(projectId, endpoints.sourceType, endpoints.sourceId);
    await this.ensureEndpointBoundary(projectId, endpoints.targetType, endpoints.targetId);
    this.assertDifferentEndpoints(endpoints);
    await this.ensureNoDuplicate(projectId, endpoints, dto.relationType.trim(), undefined, dto.isCurrent ?? true);

    const data = this.normalizeRelationshipData(dto);
    return this.prisma.relationship.create({
      data: {
        ...data,
        projectId,
        sourceType: endpoints.sourceType,
        sourceId: endpoints.sourceId,
        targetType: endpoints.targetType,
        targetId: endpoints.targetId,
        relationType: dto.relationType.trim(),
        direction: dto.direction?.trim() || 'directed',
        canonStatus: this.parseCanonStatus(dto.canonStatus ?? 'draft'),
        isCurrent: dto.isCurrent ?? true,
        importance: dto.importance ?? 0,
      },
    });
  }

  async updateRelationship(projectId: string, relationshipId: string, dto: UpdateRelationshipDto) {
    this.validateUpdate(dto);
    const existing = await this.getRelationship(projectId, relationshipId);
    const endpoints = this.getUpdateEndpoints(existing, dto);
    await this.ensureEndpointBoundary(projectId, endpoints.sourceType, endpoints.sourceId);
    await this.ensureEndpointBoundary(projectId, endpoints.targetType, endpoints.targetId);
    this.assertDifferentEndpoints(endpoints);
    const desiredIsCurrent = dto.isCurrent ?? existing.isCurrent;
    await this.ensureNoDuplicate(projectId, endpoints, (dto.relationType ?? existing.relationType).trim(), relationshipId, desiredIsCurrent);

    const data = this.normalizeRelationshipData(dto);
    return this.prisma.relationship.update({
      where: { id: relationshipId },
      data: {
        ...data,
        sourceType: endpoints.sourceType,
        sourceId: endpoints.sourceId,
        targetType: endpoints.targetType,
        targetId: endpoints.targetId,
        relationType: dto.relationType === undefined ? undefined : dto.relationType.trim(),
        direction: dto.direction === undefined ? undefined : dto.direction.trim(),
        canonStatus: dto.canonStatus === undefined ? undefined : this.parseCanonStatus(dto.canonStatus),
      },
    });
  }

  async deleteRelationship(projectId: string, relationshipId: string) {
    await this.getRelationship(projectId, relationshipId);
    return this.prisma.relationship.update({ where: { id: relationshipId }, data: { deletedAt: new Date() } });
  }

  async confirmRelationship(projectId: string, relationshipId: string) {
    await this.getRelationship(projectId, relationshipId);
    return this.prisma.relationship.update({ where: { id: relationshipId }, data: { canonStatus: 'confirmed' } });
  }

  async archiveRelationship(projectId: string, relationshipId: string) {
    await this.getRelationship(projectId, relationshipId);
    return this.prisma.relationship.update({ where: { id: relationshipId }, data: { canonStatus: 'archived' } });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async ensureEndpointBoundary(projectId: string, type: RelationshipEntityType, id: string) {
    const modelName = entityModelByType[type];
    const entity = await (this.prisma as unknown as Record<string, { findFirst(args: unknown): Promise<unknown> }>)[modelName].findFirst({
      where: { id, projectId, deletedAt: null },
      select: { id: true },
    });
    if (!entity) throw new BadRequestException(`${type}:${id} must belong to the project and not be deleted`);
  }

  private async ensureNoDuplicate(projectId: string, endpoints: RelationshipEndpoint, relationType: string, excludeId?: string, desiredIsCurrent = true) {
    if (!desiredIsCurrent) return;
    const duplicate = await this.prisma.relationship.findFirst({
      where: {
        projectId,
        sourceType: endpoints.sourceType,
        sourceId: endpoints.sourceId,
        targetType: endpoints.targetType,
        targetId: endpoints.targetId,
        relationType,
        isCurrent: true,
        deletedAt: null,
      },
    });
    if (duplicate && duplicate.id !== excludeId) throw new ConflictException('active relationship already exists for this source/target/relationType');
  }

  private buildListWhere(projectId: string, query: ListRelationshipsQueryDto) {
    const where: Record<string, unknown> = { projectId, deletedAt: null };
    if (query.sourceType !== undefined) where.sourceType = this.parseEntityType(query.sourceType, 'sourceType');
    if (query.sourceId !== undefined) where.sourceId = this.parseRequiredString(query.sourceId, 'sourceId');
    if (query.targetType !== undefined) where.targetType = this.parseEntityType(query.targetType, 'targetType');
    if (query.targetId !== undefined) where.targetId = this.parseRequiredString(query.targetId, 'targetId');
    if (query.relationType !== undefined) where.relationType = this.parseRequiredString(query.relationType, 'relationType');
    if (query.canonStatus !== undefined) where.canonStatus = this.parseCanonStatus(query.canonStatus);
    const isCurrent = parseOptionalBoolean(query.isCurrent, 'isCurrent');
    if (isCurrent !== undefined) where.isCurrent = isCurrent;
    if (query.entityType !== undefined || query.entityId !== undefined) {
      const entityType = this.parseEntityType(query.entityType, 'entityType');
      const entityId = this.parseRequiredString(query.entityId, 'entityId');
      where.OR = [
        { sourceType: entityType, sourceId: entityId },
        { targetType: entityType, targetId: entityId },
      ];
    }
    return where;
  }

  private parsePagination(query: ListRelationshipsQueryDto) {
    const page = parsePositiveInteger(query.page, DEFAULT_PAGE, 'page');
    const pageSize = Math.min(parsePositiveInteger(query.pageSize, DEFAULT_PAGE_SIZE, 'pageSize'), MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private validateCreate(dto: CreateRelationshipDto) {
    if (!dto) throw new BadRequestException('request body cannot be empty');
    this.parseEntityType(dto.sourceType, 'sourceType');
    this.parseRequiredString(dto.sourceId, 'sourceId');
    this.parseEntityType(dto.targetType, 'targetType');
    this.parseRequiredString(dto.targetId, 'targetId');
    this.parseRequiredString(dto.relationType, 'relationType');
    this.parseDirection(dto.direction);
    this.parseCanonStatus(dto.canonStatus ?? 'draft');
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.strength, 'strength');
  }

  private validateUpdate(dto: UpdateRelationshipDto) {
    assertNonEmptyBody(dto);
    if (dto.sourceType !== undefined) this.parseEntityType(dto.sourceType, 'sourceType');
    if (dto.sourceId !== undefined) this.parseRequiredString(dto.sourceId, 'sourceId');
    if (dto.targetType !== undefined) this.parseEntityType(dto.targetType, 'targetType');
    if (dto.targetId !== undefined) this.parseRequiredString(dto.targetId, 'targetId');
    if (dto.relationType !== undefined) this.parseRequiredString(dto.relationType, 'relationType');
    this.parseDirection(dto.direction);
    if (dto.canonStatus !== undefined) this.parseCanonStatus(dto.canonStatus);
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.strength, 'strength');
  }

  private getCreateEndpoints(dto: CreateRelationshipDto): RelationshipEndpoint {
    return {
      sourceType: this.parseEntityType(dto.sourceType, 'sourceType'),
      sourceId: dto.sourceId.trim(),
      targetType: this.parseEntityType(dto.targetType, 'targetType'),
      targetId: dto.targetId.trim(),
    };
  }

  private getUpdateEndpoints(existing: { sourceType: string; sourceId: string; targetType: string; targetId: string }, dto: UpdateRelationshipDto): RelationshipEndpoint {
    return {
      sourceType: dto.sourceType === undefined ? this.parseEntityType(existing.sourceType, 'sourceType') : this.parseEntityType(dto.sourceType, 'sourceType'),
      sourceId: dto.sourceId === undefined ? existing.sourceId : dto.sourceId.trim(),
      targetType: dto.targetType === undefined ? this.parseEntityType(existing.targetType, 'targetType') : this.parseEntityType(dto.targetType, 'targetType'),
      targetId: dto.targetId === undefined ? existing.targetId : dto.targetId.trim(),
    };
  }

  private assertDifferentEndpoints(endpoints: RelationshipEndpoint) {
    if (endpoints.sourceType === endpoints.targetType && endpoints.sourceId === endpoints.targetId) {
      throw new BadRequestException('source and target cannot be the same entity');
    }
  }

  private parseEntityType(type: string | undefined, field: string): RelationshipEntityType {
    if (typeof type !== 'string' || !type.trim()) throw new BadRequestException(`${field} is required`);
    const normalized = type.trim() as RelationshipEntityType;
    if (!(normalized in entityModelByType)) throw new BadRequestException(`${field} is not supported`);
    return normalized;
  }

  private parseRequiredString(value: string | undefined, field: string) {
    if (typeof value !== 'string' || !value.trim()) throw new BadRequestException(`${field} is required`);
    return value.trim();
  }

  private parseDirection(direction: string | undefined) {
    if (direction === undefined || direction === '') return 'directed';
    const normalized = direction.trim();
    if (!allowedDirections.has(normalized)) throw new BadRequestException('direction must be directed or bidirectional');
    return normalized;
  }

  private parseCanonStatus(canonStatus: string): CanonStatus {
    const normalized = canonStatus.trim() as CanonStatus;
    if (!allowedCanonStatuses.has(normalized)) throw new BadRequestException('canonStatus must be draft, confirmed, or archived');
    return normalized;
  }

  private normalizeRelationshipData(data: RelationshipData) {
    return normalizeOptionalStrings(data, ['sourceType', 'sourceId', 'targetType', 'targetId', 'relationType', 'description', 'direction', 'startsAt', 'endsAt', 'canonStatus', 'evidenceType', 'evidenceId']);
  }
}

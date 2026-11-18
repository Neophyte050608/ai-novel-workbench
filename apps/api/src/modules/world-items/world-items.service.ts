import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { WorldItemType } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateWorldItemDto } from './dto/create-world-item.dto';
import { UpdateWorldItemDto } from './dto/update-world-item.dto';

const worldItemOrderBy = [{ importance: 'desc' as const }, { updatedAt: 'desc' as const }];
const allowedGenericTypes = new Set<WorldItemType>([
  WorldItemType.system,
  WorldItemType.history,
  WorldItemType.culture,
  WorldItemType.concept,
  WorldItemType.social_system,
  WorldItemType.custom,
]);

type WorldItemData = Omit<UpdateWorldItemDto, never>;

function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) {
  const normalized: Record<string, unknown> = { ...data };
  for (const field of fields) if (field in normalized && typeof normalized[field] === 'string') normalized[field] = (normalized[field] as string).trim();
  return normalized as T;
}

function assertNonEmptyBody(dto: object | undefined) { if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty'); }
function assertNonNegativeInteger(value: number | undefined, field: string) { if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new BadRequestException(`${field} must be a non-negative integer`); }

@Injectable()
export class WorldItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async listWorldItems(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.worldItem.findMany({ where: { projectId, deletedAt: null }, orderBy: worldItemOrderBy });
  }

  async getWorldItem(projectId: string, worldItemId: string) {
    const worldItem = await this.prisma.worldItem.findFirst({ where: { id: worldItemId, projectId, deletedAt: null } });
    if (!worldItem) throw new NotFoundException(`WorldItem ${worldItemId} not found in project ${projectId}`);
    return worldItem;
  }

  async createWorldItem(projectId: string, dto: CreateWorldItemDto) {
    this.validateCreateWorldItem(dto);
    await this.ensureProject(projectId);
    return this.prisma.worldItem.create({
      data: {
        ...this.normalizeWorldItemData(dto),
        name: dto.name.trim(),
        type: this.normalizeType(dto.type),
        tags: this.normalizeTags(dto.tags),
        projectId,
        canonStatus: 'draft',
      },
    });
  }

  async updateWorldItem(projectId: string, worldItemId: string, dto: UpdateWorldItemDto) {
    this.validateUpdateWorldItem(dto);
    await this.getWorldItem(projectId, worldItemId);
    return this.prisma.worldItem.update({
      where: { id: worldItemId },
      data: {
        ...this.normalizeWorldItemData(dto),
        type: dto.type === undefined ? undefined : this.normalizeType(dto.type),
        tags: dto.tags === undefined ? undefined : this.normalizeTags(dto.tags),
      },
    });
  }

  async deleteWorldItem(projectId: string, worldItemId: string) {
    await this.getWorldItem(projectId, worldItemId);
    return this.prisma.worldItem.update({ where: { id: worldItemId }, data: { deletedAt: new Date() } });
  }

  async confirmWorldItem(projectId: string, worldItemId: string) {
    await this.getWorldItem(projectId, worldItemId);
    return this.prisma.worldItem.update({ where: { id: worldItemId }, data: { canonStatus: 'confirmed' } });
  }

  async archiveWorldItem(projectId: string, worldItemId: string) {
    await this.getWorldItem(projectId, worldItemId);
    return this.prisma.worldItem.update({ where: { id: worldItemId }, data: { canonStatus: 'archived' } });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private validateCreateWorldItem(dto: CreateWorldItemDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) throw new BadRequestException('name is required');
    this.assertAllowedType(dto.type);
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateUpdateWorldItem(dto: UpdateWorldItemDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) throw new BadRequestException('name cannot be empty');
    this.assertAllowedType(dto.type);
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private assertAllowedType(type?: string) {
    if (type === undefined) return;
    if (typeof type !== 'string' || !allowedGenericTypes.has(type.trim() as WorldItemType)) {
      throw new BadRequestException('type must be one of system, history, culture, concept, social_system, custom');
    }
  }

  private normalizeType(type?: string): WorldItemType {
    return (type?.trim() || WorldItemType.custom) as WorldItemType;
  }

  private normalizeWorldItemData(data: WorldItemData) {
    return normalizeOptionalStrings(data, ['name', 'summary', 'content', 'visibility', 'sourceType', 'sourceId']);
  }

  private normalizeTags(tags: string[] | undefined) {
    return tags?.map((tag) => tag.trim()).filter((tag) => tag.length > 0) ?? [];
  }
}

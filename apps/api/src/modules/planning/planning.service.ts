import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CanonStatus, ChapterStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateChapterPlanDto } from './dto/create-chapter-plan.dto';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { ReorderVolumesDto } from './dto/reorder-volumes.dto';
import { UpdateChapterPlanDto } from './dto/update-chapter-plan.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';

const orderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const planStatuses = new Set(['planned', 'confirmed', 'archived']);
type VolumeData = CreateVolumeDto | UpdateVolumeDto;
type ChapterPlanData = CreateChapterPlanDto | UpdateChapterPlanDto;
type BoundaryChapter = { id: string; projectId: string; volumeId: string | null; orderIndex: number };

type ChapterPlanBoundary = {
  id: string;
  projectId: string;
  volumeId: string | null;
  chapterId: string | null;
  title: string | null;
  goal: string | null;
  outline: string | null;
  pov: string | null;
  orderIndex: number;
  status: string;
  canonStatus: CanonStatus;
};

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty');
}

function assertWritableData(data: Record<string, unknown>) {
  if (Object.keys(data).length === 0) throw new BadRequestException('request body must include at least one writable field');
}

function assertNoControlledFields(data: Record<string, unknown>, fields: string[]) {
  const controlled = fields.filter((field) => Object.prototype.hasOwnProperty.call(data, field));
  if (controlled.length > 0) throw new BadRequestException(`controlled fields are not writable: ${controlled.join(', ')}`);
}

function assertNonNegativeInteger(value: number | null | undefined, field: string) {
  if (value !== undefined && value !== null && (!Number.isInteger(value) || value < 0)) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
}

function assertStringField(value: string | null | undefined, field: string, required = false) {
  if (value === undefined || value === null) {
    if (required) throw new BadRequestException(`${field} is required`);
    return;
  }
  if (typeof value !== 'string' || value.trim().length === 0) throw new BadRequestException(`${field} cannot be empty`);
}

function pickAllowedFields<T extends Record<string, unknown>>(data: T, fields: string[], stringFields: string[] = []) {
  const output: Record<string, unknown> = {};
  const stringFieldSet = new Set(stringFields);
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
    const value = data[field];
    output[field] = stringFieldSet.has(field) && typeof value === 'string' ? value.trim() : value;
  }
  return output;
}

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async listVolumes(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.volume.findMany({ where: { projectId, deletedAt: null }, orderBy });
  }

  async createVolume(projectId: string, dto: CreateVolumeDto) {
    this.validateVolumeBody(dto, false);
    await this.ensureProject(projectId);
    return this.prisma.volume.create({ data: { ...this.normalizeVolumeData(dto), projectId, title: dto.title!.trim() } });
  }

  async getVolume(projectId: string, volumeId: string) {
    const volume = await this.prisma.volume.findFirst({ where: { id: volumeId, projectId, deletedAt: null } });
    if (!volume) throw new NotFoundException(`Volume ${volumeId} not found in project ${projectId}`);
    return volume;
  }

  async updateVolume(projectId: string, volumeId: string, dto: UpdateVolumeDto) {
    assertNoControlledFields(dto as Record<string, unknown>, ['id', 'projectId', 'createdAt', 'updatedAt', 'deletedAt', 'chapterPlans', 'chapters']);
    this.validateVolumeBody(dto, true);
    await this.getVolume(projectId, volumeId);
    const data = this.normalizeVolumeData(dto);
    assertWritableData(data);
    return this.prisma.volume.update({ where: { id: volumeId }, data });
  }

  async deleteVolume(projectId: string, volumeId: string) {
    await this.getVolume(projectId, volumeId);
    return this.prisma.volume.update({ where: { id: volumeId }, data: { deletedAt: new Date(), status: 'archived' } });
  }

  async reorderVolumes(projectId: string, dto: ReorderVolumesDto) {
    const volumeIds = this.normalizeIds(dto?.volumeIds, 'volumeIds');
    await this.ensureProject(projectId);
    const volumes = await this.prisma.volume.findMany({ where: { projectId, deletedAt: null }, select: { id: true } });
    if (volumes.length !== volumeIds.length) throw new BadRequestException('volumeIds must include every non-deleted volume in the project');
    const projectVolumeIds = new Set(volumes.map((volume) => volume.id));
    if (volumeIds.some((id) => !projectVolumeIds.has(id))) throw new BadRequestException('all volumeIds must belong to the project and not be deleted');
    await this.prisma.$transaction(volumeIds.map((id, index) => this.prisma.volume.update({ where: { id }, data: { orderIndex: index } })));
    return this.listVolumes(projectId);
  }

  async listChapterPlans(projectId: string, query: { volumeId?: string; status?: string; includeArchived?: string; unassigned?: string } = {}) {
    await this.ensureProject(projectId);
    const where: Record<string, unknown> = { projectId, deletedAt: null };
    if (query.unassigned === 'true') {
      where.volumeId = null;
    } else if (query.volumeId) {
      assertStringField(query.volumeId, 'volumeId');
      await this.ensureVolumeBoundary(projectId, query.volumeId);
      where.volumeId = query.volumeId.trim();
    }
    if (query.status) {
      assertStringField(query.status, 'status');
      const status = query.status.trim();
      if (!planStatuses.has(status)) throw new BadRequestException('status must be one of planned, confirmed, archived');
      where.status = status;
    } else if (query.includeArchived !== 'true') {
      where.status = { not: 'archived' };
    }
    return this.prisma.chapterPlan.findMany({ where, orderBy });
  }

  async createChapterPlan(projectId: string, dto: CreateChapterPlanDto) {
    this.validatePlanBody(dto, false);
    await this.ensureProject(projectId);
    const volumeId = this.normalizeNullableId(dto.volumeId);
    const chapterId = this.normalizeNullableId(dto.chapterId);
    await this.ensurePlanningBoundary(projectId, volumeId, chapterId);
    return this.prisma.chapterPlan.create({
      data: {
        ...this.normalizePlanData(dto),
        projectId,
        volumeId,
        chapterId,
        status: dto.status?.trim() ?? 'planned',
        canonStatus: CanonStatus.draft,
      },
    });
  }

  async getChapterPlan(projectId: string, planId: string) {
    const plan = await this.prisma.chapterPlan.findFirst({ where: { id: planId, projectId, deletedAt: null } });
    if (!plan) throw new NotFoundException(`ChapterPlan ${planId} not found in project ${projectId}`);
    return plan;
  }

  async updateChapterPlan(projectId: string, planId: string, dto: UpdateChapterPlanDto) {
    assertNoControlledFields(dto as Record<string, unknown>, ['id', 'projectId', 'chapterId', 'canonStatus', 'createdAt', 'updatedAt', 'deletedAt', 'project', 'volume', 'chapter', 'scenePlans']);
    this.validatePlanBody(dto, true);
    const plan = await this.getPlanBoundary(projectId, planId, false);
    const nextVolumeId = Object.prototype.hasOwnProperty.call(dto, 'volumeId') ? this.normalizeNullableId(dto.volumeId) : plan.volumeId;
    await this.ensurePlanningBoundary(projectId, nextVolumeId, plan.chapterId);
    const data = this.normalizePlanData(dto);
    if (Object.prototype.hasOwnProperty.call(dto, 'volumeId')) data.volumeId = nextVolumeId;
    assertWritableData(data);
    return this.prisma.chapterPlan.update({ where: { id: planId }, data });
  }

  async deleteChapterPlan(projectId: string, planId: string) {
    await this.getChapterPlan(projectId, planId);
    return this.prisma.chapterPlan.update({ where: { id: planId }, data: { deletedAt: new Date(), status: 'archived', canonStatus: CanonStatus.archived } });
  }

  async confirmChapterPlan(projectId: string, planId: string) {
    await this.getChapterPlan(projectId, planId);
    return this.prisma.chapterPlan.update({ where: { id: planId }, data: { status: 'confirmed', canonStatus: CanonStatus.confirmed } });
  }

  async archiveChapterPlan(projectId: string, planId: string) {
    await this.getChapterPlan(projectId, planId);
    return this.prisma.chapterPlan.update({ where: { id: planId }, data: { status: 'archived', canonStatus: CanonStatus.archived } });
  }

  async restoreChapterPlan(projectId: string, planId: string) {
    const plan = await this.getPlanBoundary(projectId, planId, true);
    await this.ensurePlanningBoundary(projectId, plan.volumeId, plan.chapterId);
    return this.prisma.chapterPlan.update({ where: { id: planId }, data: { deletedAt: null, status: 'planned', canonStatus: CanonStatus.draft } });
  }

  async createChapterFromPlan(projectId: string, planId: string) {
    const plan = await this.getPlanBoundary(projectId, planId, false);
    if (plan.status === 'archived' || plan.canonStatus === CanonStatus.archived) throw new BadRequestException('archived chapter plan cannot create a chapter');
    if (plan.chapterId) throw new BadRequestException('chapter plan is already linked to a chapter');
    await this.ensurePlanningBoundary(projectId, plan.volumeId, null);
    const nextOrderIndex = await this.nextChapterOrderIndex(projectId, plan.volumeId);
    const title = plan.title?.trim() || `章节计划 #${plan.orderIndex}`;
    return this.prisma.$transaction(async (tx) => {
      const chapter = await tx.chapter.create({
        data: {
          projectId,
          volumeId: plan.volumeId,
          title,
          plannedTitle: plan.title,
          goal: plan.goal,
          summary: plan.outline,
          orderIndex: nextOrderIndex,
          status: ChapterStatus.draft,
        },
      });
      await tx.chapterPlan.update({ where: { id: planId }, data: { chapterId: chapter.id, status: 'confirmed', canonStatus: CanonStatus.confirmed } });
      return chapter;
    });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async ensureVolumeBoundary(projectId: string, volumeId?: string | null) {
    if (volumeId === undefined || volumeId === null) return;
    assertStringField(volumeId, 'volumeId');
    const volume = await this.prisma.volume.findFirst({ where: { id: volumeId.trim(), projectId, deletedAt: null }, select: { id: true } });
    if (!volume) throw new BadRequestException('volumeId must belong to the project');
  }

  private async ensureChapterBoundary(projectId: string, chapterId?: string | null): Promise<BoundaryChapter | null> {
    if (chapterId === undefined || chapterId === null) return null;
    assertStringField(chapterId, 'chapterId');
    const chapter = await this.prisma.chapter.findFirst({ where: { id: chapterId.trim(), projectId, deletedAt: null }, select: { id: true, projectId: true, volumeId: true, orderIndex: true } });
    if (!chapter) throw new BadRequestException('chapterId must belong to the project');
    return chapter;
  }

  private async ensurePlanningBoundary(projectId: string, volumeId?: string | null, chapterId?: string | null) {
    await this.ensureVolumeBoundary(projectId, volumeId);
    const chapter = await this.ensureChapterBoundary(projectId, chapterId);
    if (chapter && volumeId !== undefined && volumeId !== null && chapter.volumeId !== volumeId) {
      throw new BadRequestException('volumeId must match the linked chapter volume');
    }
  }

  private async getPlanBoundary(projectId: string, planId: string, includeDeleted: boolean): Promise<ChapterPlanBoundary> {
    const plan = await this.prisma.chapterPlan.findFirst({
      where: { id: planId, projectId, ...(includeDeleted ? {} : { deletedAt: null }) },
      select: { id: true, projectId: true, volumeId: true, chapterId: true, title: true, goal: true, outline: true, pov: true, orderIndex: true, status: true, canonStatus: true },
    });
    if (!plan) throw new NotFoundException(`ChapterPlan ${planId} not found in project ${projectId}`);
    return plan;
  }

  private async nextChapterOrderIndex(projectId: string, volumeId?: string | null) {
    const latest = await this.prisma.chapter.findFirst({
      where: { projectId, deletedAt: null, ...(volumeId ? { volumeId } : {}) },
      orderBy: [{ orderIndex: 'desc' }, { createdAt: 'desc' }],
      select: { orderIndex: true },
    });
    return (latest?.orderIndex ?? -1) + 1;
  }

  private normalizeIds(ids: string[] | undefined, field: string) {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestException(`${field} is required`);
    const normalized = ids.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean);
    if (normalized.length !== ids.length) throw new BadRequestException(`${field} cannot contain empty values`);
    if (new Set(normalized).size !== normalized.length) throw new BadRequestException(`${field} cannot contain duplicates`);
    return normalized;
  }

  private validateVolumeBody(dto: VolumeData, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertStringField(dto?.title, 'title', !requireBody);
    assertStringField(dto?.summary, 'summary');
    assertStringField(dto?.goal, 'goal');
    assertStringField(dto?.status, 'status');
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
  }

  private validatePlanBody(dto: ChapterPlanData, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertStringField(dto?.volumeId, 'volumeId');
    if ('chapterId' in dto) assertStringField((dto as CreateChapterPlanDto).chapterId, 'chapterId');
    assertStringField(dto?.title, 'title');
    assertStringField(dto?.goal, 'goal');
    assertStringField(dto?.outline, 'outline');
    assertStringField(dto?.pov, 'pov');
    assertStringField(dto?.sourceType, 'sourceType');
    assertStringField(dto?.sourceId, 'sourceId');
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
    if (dto?.status !== undefined) {
      assertStringField(dto.status, 'status');
      if (!planStatuses.has(dto.status.trim())) throw new BadRequestException('status must be one of planned, confirmed, archived');
    }
  }

  private normalizeVolumeData(data: VolumeData) {
    return pickAllowedFields(data as Record<string, unknown>, ['title', 'summary', 'goal', 'status', 'orderIndex'], ['title', 'summary', 'goal', 'status']);
  }

  private normalizePlanData(data: ChapterPlanData) {
    const output = pickAllowedFields(
      data as Record<string, unknown>,
      ['title', 'goal', 'outline', 'pov', 'constraints', 'orderIndex', 'status', 'sourceType', 'sourceId'],
      ['title', 'goal', 'outline', 'pov', 'status', 'sourceType', 'sourceId'],
    );
    return output;
  }

  private normalizeNullableId(value: string | null | undefined) {
    if (value === undefined || value === null) return null;
    return value.trim();
  }
}

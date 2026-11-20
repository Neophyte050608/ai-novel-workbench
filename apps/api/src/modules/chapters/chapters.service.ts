import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChapterStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { ReorderChaptersDto } from './dto/reorder-chapters.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

const chapterOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const chapterStatuses = new Set<string>(Object.values(ChapterStatus));
type ChapterData = CreateChapterDto | UpdateChapterDto;

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty');
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
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async listChapters(projectId: string) {
    await this.ensureProject(projectId);
    return this.prisma.chapter.findMany({ where: { projectId, deletedAt: null }, orderBy: chapterOrderBy });
  }

  async createChapter(projectId: string, dto: CreateChapterDto) {
    this.validateCreateChapter(dto);
    await this.ensureProject(projectId);
    await this.ensureVolumeBoundary(projectId, dto.volumeId);

    return this.prisma.chapter.create({
      data: {
        ...this.normalizeChapterData(dto),
        projectId,
        title: dto.title!.trim(),
        status: this.normalizeStatus(dto.status) ?? ChapterStatus.draft,
      },
    });
  }

  async getChapter(projectId: string, chapterId: string) {
    const chapter = await this.prisma.chapter.findFirst({ where: { id: chapterId, projectId, deletedAt: null } });
    if (!chapter) throw new NotFoundException(`Chapter ${chapterId} not found in project ${projectId}`);
    return chapter;
  }

  async updateChapter(projectId: string, chapterId: string, dto: UpdateChapterDto) {
    this.validateUpdateChapter(dto);
    await this.getChapter(projectId, chapterId);
    await this.ensureVolumeBoundary(projectId, dto.volumeId ?? undefined);

    const data = {
      ...this.normalizeChapterData(dto),
      status: dto.status === undefined ? undefined : this.normalizeStatus(dto.status),
    };
    if (Object.values(data).every((value) => value === undefined)) {
      throw new BadRequestException('request body must include at least one writable field');
    }
    return this.prisma.chapter.update({ where: { id: chapterId }, data });
  }

  async deleteChapter(projectId: string, chapterId: string) {
    await this.getChapter(projectId, chapterId);
    return this.prisma.chapter.update({ where: { id: chapterId }, data: { deletedAt: new Date(), status: ChapterStatus.archived } });
  }

  async reorderChapters(projectId: string, dto: ReorderChaptersDto) {
    if (!dto || !Array.isArray(dto.chapterIds) || dto.chapterIds.length === 0) throw new BadRequestException('chapterIds is required');
    const chapterIds = dto.chapterIds.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean);
    if (chapterIds.length !== dto.chapterIds.length) throw new BadRequestException('chapterIds cannot contain empty values');
    if (new Set(chapterIds).size !== chapterIds.length) throw new BadRequestException('chapterIds cannot contain duplicates');

    await this.ensureProject(projectId);
    const chapters = await this.prisma.chapter.findMany({ where: { projectId, deletedAt: null }, select: { id: true } });
    if (chapters.length !== chapterIds.length) throw new BadRequestException('chapterIds must include every non-deleted chapter in the project');
    const projectChapterIds = new Set(chapters.map((chapter: { id: string }) => chapter.id));
    if (chapterIds.some((id) => !projectChapterIds.has(id))) throw new BadRequestException('all chapterIds must belong to the project and not be deleted');

    await this.prisma.$transaction(chapterIds.map((id, index) => this.prisma.chapter.update({ where: { id }, data: { orderIndex: index } })));
    return this.listChapters(projectId);
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

  private validateCreateChapter(dto: CreateChapterDto) {
    assertStringField(dto?.title, 'title', true);
    this.validateOptionalFields(dto);
  }

  private validateUpdateChapter(dto: UpdateChapterDto) {
    assertNonEmptyBody(dto);
    assertStringField(dto.title, 'title');
    this.validateOptionalFields(dto);
  }

  private validateOptionalFields(dto: ChapterData) {
    assertStringField(dto?.plannedTitle, 'plannedTitle');
    assertStringField(dto?.goal, 'goal');
    assertStringField(dto?.volumeId, 'volumeId');
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
    if (dto?.status !== undefined) {
      assertStringField(dto.status, 'status');
      if (!chapterStatuses.has(dto.status.trim())) throw new BadRequestException(`status must be one of ${Object.values(ChapterStatus).join(', ')}`);
    }
  }

  private normalizeStatus(status?: string | null): ChapterStatus | undefined {
    if (status === undefined || status === null) return undefined;
    return status.trim() as ChapterStatus;
  }

  private normalizeChapterData(data: ChapterData) {
    return pickAllowedFields(
      data as Record<string, unknown>,
      ['title', 'plannedTitle', 'goal', 'orderIndex', 'volumeId'],
      ['title', 'plannedTitle', 'goal', 'volumeId'],
    );
  }
}

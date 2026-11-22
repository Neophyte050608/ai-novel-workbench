import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChapterStatus, ChapterVersionSource } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AssembleChapterFromScenesDto } from './dto/assemble-chapter-from-scenes.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { CreateChapterVersionDto } from './dto/create-chapter-version.dto';
import { ReorderChaptersDto } from './dto/reorder-chapters.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateChapterVersionDto } from './dto/update-chapter-version.dto';

const chapterOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const latestVersionOrderBy = [{ createdAt: 'desc' as const }];
const chapterStatuses = new Set<string>(Object.values(ChapterStatus));
const chapterVersionSources = new Set<string>(Object.values(ChapterVersionSource));
type ChapterData = CreateChapterDto | UpdateChapterDto;
type ChapterVersionData = CreateChapterVersionDto | UpdateChapterVersionDto;

type ChapterBoundary = { id: string; projectId: string; currentVersionId: string | null; deletedAt: Date | null };

type SceneForAssembly = {
  id: string;
  title: string | null;
  orderIndex: number;
  currentVersionId: string | null;
};

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty');
}

function assertWritableData(data: Record<string, unknown>) {
  if (Object.keys(data).length === 0) {
    throw new BadRequestException('request body must include at least one writable field');
  }
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

  async listVersions(projectId: string, chapterId: string) {
    await this.getChapter(projectId, chapterId);
    return this.prisma.chapterVersion.findMany({ where: { chapterId }, orderBy: latestVersionOrderBy });
  }

  async createVersion(projectId: string, chapterId: string, dto: CreateChapterVersionDto) {
    this.validateVersionBody(dto, false);
    const chapter = await this.getChapter(projectId, chapterId);
    const content = dto.content.trim();
    return this.prisma.chapterVersion.create({
      data: {
        ...this.normalizeVersionData(dto),
        chapterId: chapter.id,
        source: this.normalizeVersionSource(dto.source) ?? ChapterVersionSource.user,
        content,
      },
    });
  }

  async getVersion(projectId: string, versionId: string) {
    const version = await this.prisma.chapterVersion.findFirst({ where: { id: versionId } });
    if (!version) throw new NotFoundException(`ChapterVersion ${versionId} not found`);
    await this.ensureChapterBoundary(projectId, version.chapterId);
    return version;
  }

  async updateVersion(projectId: string, versionId: string, dto: UpdateChapterVersionDto) {
    this.validateVersionBody(dto, true);
    await this.getVersion(projectId, versionId);
    const data = {
      ...this.normalizeVersionData(dto),
      source: dto.source === undefined ? undefined : this.normalizeVersionSource(dto.source),
    };
    assertWritableData(Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
    return this.prisma.chapterVersion.update({ where: { id: versionId }, data });
  }

  async activateVersion(projectId: string, chapterId: string, versionId: string) {
    const chapter = await this.getChapter(projectId, chapterId);
    const normalizedVersionId = this.normalizeRequiredId(versionId, 'versionId');
    await this.ensureVersionBoundary(projectId, chapter.id, normalizedVersionId);
    return this.prisma.chapter.update({ where: { id: chapter.id }, data: { currentVersionId: normalizedVersionId } });
  }

  async assembleFromScenes(projectId: string, chapterId: string, dto: AssembleChapterFromScenesDto = {}) {
    const chapter = await this.getChapter(projectId, chapterId);
    const scenes = await this.prisma.scene.findMany({ where: { projectId, chapterId: chapter.id, deletedAt: null }, orderBy: chapterOrderBy });
    if (scenes.length === 0) throw new BadRequestException('cannot assemble chapter without scenes');

    const parts: string[] = [];
    for (const scene of scenes as SceneForAssembly[]) {
      if (!scene.currentVersionId) {
        throw new BadRequestException(`Scene ${this.sceneLabel(scene)} is missing currentVersionId`);
      }
      const version = await this.prisma.sceneVersion.findFirst({
        where: { id: scene.currentVersionId, projectId, chapterId: chapter.id, sceneId: scene.id, deletedAt: null },
        select: { id: true, content: true },
      });
      if (!version) {
        throw new BadRequestException(`Scene ${this.sceneLabel(scene)} currentVersionId does not point to an active SceneVersion`);
      }
      const content = version.content.trim();
      parts.push(dto.includeSceneTitles ? [scene.title?.trim() ? `## ${scene.title.trim()}` : `## 场景 ${scene.orderIndex}`, content].filter(Boolean).join('\n\n') : content);
    }

    const version = await this.prisma.chapterVersion.create({
      data: {
        chapterId: chapter.id,
        source: ChapterVersionSource.user,
        content: parts.join('\n\n'),
        changeSummary: dto.changeSummary?.trim() || 'assembled from current scene versions',
      },
    });

    if (dto.activate === true) {
      await this.prisma.chapter.update({ where: { id: chapter.id }, data: { currentVersionId: version.id } });
    }

    return version;
  }

  async getProfile(projectId: string, chapterId: string) {
    const chapter = await this.getChapter(projectId, chapterId);
    const [currentVersion, versions, scenes] = await Promise.all([
      chapter.currentVersionId ? this.prisma.chapterVersion.findFirst({ where: { id: chapter.currentVersionId, chapterId: chapter.id } }) : null,
      this.prisma.chapterVersion.findMany({ where: { chapterId: chapter.id }, orderBy: latestVersionOrderBy }),
      this.prisma.scene.findMany({ where: { projectId, chapterId: chapter.id, deletedAt: null }, orderBy: chapterOrderBy }),
    ]);

    return {
      chapter,
      currentVersion,
      versions,
      scenes,
      stats: {
        currentWordCount: currentVersion ? this.countWords(currentVersion.content) : 0,
        versionCount: versions.length,
        sceneCount: scenes.length,
      },
      readiness: {
        hasCurrentVersion: Boolean(currentVersion),
        canAssembleFromScenes: scenes.length > 0 && (scenes as SceneForAssembly[]).every((scene) => Boolean(scene.currentVersionId)),
      },
    };
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async ensureChapterBoundary(projectId: string, chapterId?: string | null): Promise<ChapterBoundary> {
    assertStringField(chapterId, 'chapterId', true);
    await this.ensureProject(projectId);
    const chapter = await this.prisma.chapter.findFirst({ where: { id: chapterId!.trim(), projectId, deletedAt: null }, select: { id: true, projectId: true, currentVersionId: true, deletedAt: true } });
    if (!chapter) throw new BadRequestException('chapterId must belong to the project');
    return chapter;
  }

  private async ensureVolumeBoundary(projectId: string, volumeId?: string | null) {
    if (volumeId === undefined || volumeId === null) return;
    assertStringField(volumeId, 'volumeId');
    const volume = await this.prisma.volume.findFirst({ where: { id: volumeId.trim(), projectId, deletedAt: null }, select: { id: true } });
    if (!volume) throw new BadRequestException('volumeId must belong to the project');
  }

  private async ensureVersionBoundary(projectId: string, chapterId: string, versionId?: string | null) {
    assertStringField(versionId, 'versionId', true);
    await this.ensureChapterBoundary(projectId, chapterId);
    const version = await this.prisma.chapterVersion.findFirst({ where: { id: versionId!.trim(), chapterId }, select: { id: true } });
    if (!version) throw new BadRequestException('versionId must belong to the same project and chapter');
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

  private validateVersionBody(dto: ChapterVersionData, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertStringField(dto?.content, 'content', !requireBody);
    assertStringField(dto?.changeSummary, 'changeSummary');
    if (dto?.source !== undefined) {
      assertStringField(dto.source, 'source');
      if (!chapterVersionSources.has(dto.source.trim())) throw new BadRequestException(`source must be one of ${Object.values(ChapterVersionSource).join(', ')}`);
    }
  }

  private normalizeStatus(status?: string | null): ChapterStatus | undefined {
    if (status === undefined || status === null) return undefined;
    return status.trim() as ChapterStatus;
  }

  private normalizeVersionSource(source?: string | null): ChapterVersionSource | undefined {
    if (source === undefined || source === null) return undefined;
    return source.trim() as ChapterVersionSource;
  }

  private normalizeChapterData(data: ChapterData) {
    return pickAllowedFields(
      data as Record<string, unknown>,
      ['title', 'plannedTitle', 'goal', 'orderIndex', 'volumeId'],
      ['title', 'plannedTitle', 'goal', 'volumeId'],
    );
  }

  private normalizeVersionData(data: ChapterVersionData) {
    return pickAllowedFields(
      data as Record<string, unknown>,
      ['source', 'content', 'changeSummary'],
      ['source', 'content', 'changeSummary'],
    );
  }

  private normalizeRequiredId(value: string, field: string) {
    assertStringField(value, field, true);
    return value.trim();
  }

  private sceneLabel(scene: SceneForAssembly) {
    return scene.title?.trim() ? `"${scene.title.trim()}" (${scene.id})` : scene.id;
  }

  private countWords(content: string) {
    const compact = content.replace(/\s+/g, '');
    return compact.length;
  }
}

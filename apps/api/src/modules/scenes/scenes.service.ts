import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { ReorderScenesDto } from './dto/reorder-scenes.dto';
import { CreateScenePlanDto } from './dto/create-scene-plan.dto';
import { UpdateScenePlanDto } from './dto/update-scene-plan.dto';
import { CreateSceneVersionDto } from './dto/create-scene-version.dto';
import { UpdateSceneVersionDto } from './dto/update-scene-version.dto';
import { CreateSceneSummaryDto } from './dto/create-scene-summary.dto';
import { UpdateSceneSummaryDto } from './dto/update-scene-summary.dto';
import { CreateSceneHandoffDto } from './dto/create-scene-handoff.dto';
import { UpdateSceneHandoffDto } from './dto/update-scene-handoff.dto';

const sceneOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const childOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
const latestOrderBy = [{ createdAt: 'desc' as const }];
const sceneStatuses = new Set(['planned', 'writing', 'reviewing', 'done']);

type SceneData = Omit<UpdateSceneDto, never>;
type PlanData = Omit<UpdateScenePlanDto, never>;
type VersionData = Omit<UpdateSceneVersionDto, never>;
type SummaryData = Omit<UpdateSceneSummaryDto, never>;
type HandoffData = Omit<UpdateSceneHandoffDto, never>;

type SceneBoundary = { id: string; projectId: string; chapterId: string; orderIndex: number; currentPlanId: string | null; currentVersionId: string | null };

type ReadinessItem = { key: string; ready: boolean; message: string };

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) {
    throw new BadRequestException('request body cannot be empty');
  }
}

function assertWritableData(data: Record<string, unknown>) {
  if (Object.keys(data).length === 0) {
    throw new BadRequestException('request body must include at least one writable field');
  }
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
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${field} cannot be empty`);
  }
}

@Injectable()
export class ScenesService {
  constructor(private readonly prisma: PrismaService) {}

  async listScenes(projectId: string, chapterId: string) {
    await this.ensureChapterBoundary(projectId, chapterId);
    return this.prisma.scene.findMany({ where: { projectId, chapterId, deletedAt: null }, orderBy: sceneOrderBy });
  }

  async getScene(projectId: string, sceneId: string) {
    const scene = await this.prisma.scene.findFirst({ where: { id: sceneId, projectId, deletedAt: null } });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found in project ${projectId}`);
    return scene;
  }

  async createScene(projectId: string, chapterId: string, dto: CreateSceneDto) {
    this.validateSceneBody(dto, false);
    await this.ensureChapterBoundary(projectId, chapterId);
    await this.ensureCharacterBoundary(projectId, dto.povCharacterId);
    await this.ensureLocationBoundary(projectId, dto.primaryLocationId);

    return this.prisma.scene.create({
      data: {
        ...this.normalizeSceneData(dto),
        projectId,
        chapterId,
        status: dto.status?.trim() ?? 'planned',
        canonStatus: 'draft',
      },
    });
  }

  async updateScene(projectId: string, sceneId: string, dto: UpdateSceneDto) {
    this.validateSceneBody(dto, true);
    await this.getScene(projectId, sceneId);
    await this.ensureCharacterBoundary(projectId, dto.povCharacterId ?? undefined);
    await this.ensureLocationBoundary(projectId, dto.primaryLocationId ?? undefined);

    const data = this.normalizeSceneData(dto);
    assertWritableData(data);
    return this.prisma.scene.update({ where: { id: sceneId }, data });
  }

  async deleteScene(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.scene.update({ where: { id: sceneId }, data: { deletedAt: new Date() } });
  }

  async confirmScene(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.scene.update({ where: { id: sceneId }, data: { canonStatus: 'confirmed' } });
  }

  async archiveScene(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.scene.update({ where: { id: sceneId }, data: { canonStatus: 'archived' } });
  }

  async restoreScene(projectId: string, sceneId: string) {
    const scene = await this.prisma.scene.findFirst({ where: { id: sceneId, projectId } });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found in project ${projectId}`);
    if (!scene.deletedAt && scene.canonStatus !== 'archived') return scene;
    return this.prisma.scene.update({ where: { id: sceneId }, data: { deletedAt: null, canonStatus: 'draft' } });
  }

  async reorderScenes(projectId: string, chapterId: string, dto: ReorderScenesDto) {
    if (!dto || !Array.isArray(dto.sceneIds) || dto.sceneIds.length === 0) {
      throw new BadRequestException('sceneIds is required');
    }
    const sceneIds = dto.sceneIds.map((id) => (typeof id === 'string' ? id.trim() : '')).filter(Boolean);
    if (sceneIds.length !== dto.sceneIds.length) throw new BadRequestException('sceneIds cannot contain empty values');
    if (new Set(sceneIds).size !== sceneIds.length) throw new BadRequestException('sceneIds cannot contain duplicates');

    await this.ensureChapterBoundary(projectId, chapterId);
    const scenes = await this.prisma.scene.findMany({ where: { projectId, chapterId, deletedAt: null }, select: { id: true } });
    if (scenes.length !== sceneIds.length) throw new BadRequestException('sceneIds must include every non-deleted scene in the chapter');
    const chapterSceneIds = new Set(scenes.map((scene: { id: string }) => scene.id));
    if (sceneIds.some((id) => !chapterSceneIds.has(id))) throw new BadRequestException('all sceneIds must belong to the project chapter and not be deleted');

    await this.prisma.$transaction(sceneIds.map((id, index) => this.prisma.scene.update({ where: { id }, data: { orderIndex: index } })));
    return this.listScenes(projectId, chapterId);
  }

  async getProfile(projectId: string, sceneId: string) {
    const scene = await this.getScene(projectId, sceneId);
    const [currentPlan, currentVersion, latestSummary, latestHandoff, povCharacter, primaryLocation, previousScene] = await Promise.all([
      scene.currentPlanId
        ? this.prisma.scenePlan.findFirst({ where: { id: scene.currentPlanId, projectId, chapterId: scene.chapterId, sceneId: scene.id, deletedAt: null } })
        : null,
      scene.currentVersionId
        ? this.prisma.sceneVersion.findFirst({ where: { id: scene.currentVersionId, projectId, chapterId: scene.chapterId, sceneId: scene.id, deletedAt: null } })
        : null,
      this.prisma.sceneSummary.findFirst({ where: { projectId, sceneId: scene.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy }),
      this.prisma.sceneHandoff.findFirst({ where: { projectId, sceneId: scene.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy }),
      scene.povCharacterId ? this.prisma.character.findFirst({ where: { id: scene.povCharacterId, projectId, deletedAt: null } }) : null,
      scene.primaryLocationId ? this.prisma.location.findFirst({ where: { id: scene.primaryLocationId, projectId, deletedAt: null } }) : null,
      this.prisma.scene.findFirst({
        where: { projectId, chapterId: scene.chapterId, orderIndex: { lt: scene.orderIndex }, deletedAt: null },
        orderBy: [{ orderIndex: 'desc' }, { createdAt: 'desc' }],
        select: { id: true },
      }),
    ]);

    const previousHandoff = previousScene
      ? await this.prisma.sceneHandoff.findFirst({ where: { projectId, sceneId: previousScene.id, canonStatus: 'confirmed', deletedAt: null }, orderBy: latestOrderBy })
      : null;

    return {
      scene,
      currentPlan,
      currentVersion,
      latestSummary,
      latestHandoff,
      povCharacter,
      primaryLocation,
      readiness: this.buildReadiness(scene, currentPlan, latestSummary, latestHandoff, povCharacter, primaryLocation, previousScene, previousHandoff),
    };
  }

  async listPlans(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.scenePlan.findMany({ where: { projectId, sceneId, deletedAt: null }, orderBy: childOrderBy });
  }

  async getPlan(projectId: string, planId: string) {
    const plan = await this.prisma.scenePlan.findFirst({ where: { id: planId, projectId, deletedAt: null } });
    if (!plan) throw new NotFoundException(`ScenePlan ${planId} not found in project ${projectId}`);
    await this.ensureSceneTriplet(projectId, plan.chapterId, plan.sceneId);
    return plan;
  }

  async createPlan(projectId: string, sceneId: string, dto: CreateScenePlanDto) {
    this.validatePlanBody(dto, false);
    const scene = await this.getScene(projectId, sceneId);
    await this.ensureChapterPlanBoundary(projectId, scene.chapterId, dto.chapterPlanId);
    return this.prisma.scenePlan.create({
      data: { ...this.normalizePlanData(dto), projectId, chapterId: scene.chapterId, sceneId, canonStatus: 'draft' },
    });
  }

  async updatePlan(projectId: string, planId: string, dto: UpdateScenePlanDto) {
    this.validatePlanBody(dto, true);
    const plan = await this.getPlan(projectId, planId);
    await this.ensureChapterPlanBoundary(projectId, plan.chapterId, dto.chapterPlanId ?? undefined);
    const data = this.normalizePlanData(dto);
    assertWritableData(data);
    return this.prisma.scenePlan.update({ where: { id: planId }, data });
  }

  async deletePlan(projectId: string, planId: string) {
    await this.getPlan(projectId, planId);
    return this.prisma.scenePlan.update({ where: { id: planId }, data: { deletedAt: new Date() } });
  }

  async activatePlan(projectId: string, sceneId: string, planId: string) {
    const scene = await this.getScene(projectId, sceneId);
    const normalizedPlanId = planId.trim();
    await this.ensurePlanBoundary(projectId, scene.chapterId, sceneId, normalizedPlanId, true);
    return this.prisma.scene.update({ where: { id: sceneId }, data: { currentPlanId: normalizedPlanId } });
  }

  async listVersions(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.sceneVersion.findMany({ where: { projectId, sceneId, deletedAt: null }, orderBy: latestOrderBy });
  }

  async getVersion(projectId: string, versionId: string) {
    const version = await this.prisma.sceneVersion.findFirst({ where: { id: versionId, projectId, deletedAt: null } });
    if (!version) throw new NotFoundException(`SceneVersion ${versionId} not found in project ${projectId}`);
    await this.ensureSceneTriplet(projectId, version.chapterId, version.sceneId);
    return version;
  }

  async createVersion(projectId: string, sceneId: string, dto: CreateSceneVersionDto) {
    this.validateVersionBody(dto, false);
    const content = dto.content.trim();
    const scene = await this.getScene(projectId, sceneId);
    await this.ensureVersionBoundary(projectId, scene.chapterId, sceneId, dto.basedOnVersionId, false, 'basedOnVersionId');
    return this.prisma.sceneVersion.create({
      data: {
        ...this.normalizeVersionData(dto),
        projectId,
        chapterId: scene.chapterId,
        sceneId,
        source: dto.source?.trim() ?? 'user',
        content,
        wordCount: dto.wordCount ?? this.countWords(content),
      },
    });
  }

  async updateVersion(projectId: string, versionId: string, dto: UpdateSceneVersionDto) {
    this.validateVersionBody(dto, true);
    const version = await this.getVersion(projectId, versionId);
    await this.ensureVersionBoundary(projectId, version.chapterId, version.sceneId, dto.basedOnVersionId ?? undefined, false, 'basedOnVersionId');
    const data = this.normalizeVersionData(dto);
    if (dto.content !== undefined && dto.wordCount === undefined) data.wordCount = this.countWords(dto.content);
    assertWritableData(data);
    return this.prisma.sceneVersion.update({ where: { id: versionId }, data });
  }

  async deleteVersion(projectId: string, versionId: string) {
    await this.getVersion(projectId, versionId);
    return this.prisma.sceneVersion.update({ where: { id: versionId }, data: { deletedAt: new Date() } });
  }

  async activateVersion(projectId: string, sceneId: string, versionId: string) {
    const scene = await this.getScene(projectId, sceneId);
    const normalizedVersionId = versionId.trim();
    await this.ensureVersionBoundary(projectId, scene.chapterId, sceneId, normalizedVersionId, true, 'versionId');
    return this.prisma.scene.update({ where: { id: sceneId }, data: { currentVersionId: normalizedVersionId } });
  }

  async listSummaries(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.sceneSummary.findMany({ where: { projectId, sceneId, deletedAt: null }, orderBy: latestOrderBy });
  }

  async getSummary(projectId: string, summaryId: string) {
    const summary = await this.prisma.sceneSummary.findFirst({ where: { id: summaryId, projectId, deletedAt: null } });
    if (!summary) throw new NotFoundException(`SceneSummary ${summaryId} not found in project ${projectId}`);
    await this.ensureSceneTriplet(projectId, summary.chapterId, summary.sceneId);
    return summary;
  }

  async createSummary(projectId: string, sceneId: string, dto: CreateSceneSummaryDto) {
    this.validateSummaryBody(dto, false);
    const scene = await this.getScene(projectId, sceneId);
    await this.ensureVersionBoundary(projectId, scene.chapterId, sceneId, dto.sceneVersionId, false, 'sceneVersionId');
    return this.prisma.sceneSummary.create({
      data: { ...this.normalizeSummaryData(dto), projectId, chapterId: scene.chapterId, sceneId, summary: dto.summary.trim(), canonStatus: 'draft' },
    });
  }

  async updateSummary(projectId: string, summaryId: string, dto: UpdateSceneSummaryDto) {
    this.validateSummaryBody(dto, true);
    const summary = await this.getSummary(projectId, summaryId);
    await this.ensureVersionBoundary(projectId, summary.chapterId, summary.sceneId, dto.sceneVersionId ?? undefined, false, 'sceneVersionId');
    const data = this.normalizeSummaryData(dto);
    assertWritableData(data);
    return this.prisma.sceneSummary.update({ where: { id: summaryId }, data });
  }

  async deleteSummary(projectId: string, summaryId: string) {
    await this.getSummary(projectId, summaryId);
    return this.prisma.sceneSummary.update({ where: { id: summaryId }, data: { deletedAt: new Date() } });
  }

  async listHandoffs(projectId: string, sceneId: string) {
    await this.getScene(projectId, sceneId);
    return this.prisma.sceneHandoff.findMany({ where: { projectId, sceneId, deletedAt: null }, orderBy: latestOrderBy });
  }

  async getHandoff(projectId: string, handoffId: string) {
    const handoff = await this.prisma.sceneHandoff.findFirst({ where: { id: handoffId, projectId, deletedAt: null } });
    if (!handoff) throw new NotFoundException(`SceneHandoff ${handoffId} not found in project ${projectId}`);
    await this.ensureSceneTriplet(projectId, handoff.chapterId, handoff.sceneId);
    return handoff;
  }

  async createHandoff(projectId: string, sceneId: string, dto: CreateSceneHandoffDto) {
    this.validateHandoffBody(dto, false);
    const scene = await this.getScene(projectId, sceneId);
    await this.ensureVersionBoundary(projectId, scene.chapterId, sceneId, dto.sceneVersionId, false, 'sceneVersionId');
    await this.ensureNextSceneBoundary(projectId, dto.nextSceneId);
    return this.prisma.sceneHandoff.create({
      data: { ...this.normalizeHandoffData(dto), projectId, chapterId: scene.chapterId, sceneId, canonStatus: 'draft' },
    });
  }

  async updateHandoff(projectId: string, handoffId: string, dto: UpdateSceneHandoffDto) {
    this.validateHandoffBody(dto, true);
    const handoff = await this.getHandoff(projectId, handoffId);
    await this.ensureVersionBoundary(projectId, handoff.chapterId, handoff.sceneId, dto.sceneVersionId ?? undefined, false, 'sceneVersionId');
    await this.ensureNextSceneBoundary(projectId, dto.nextSceneId ?? undefined);
    const data = this.normalizeHandoffData(dto);
    assertWritableData(data);
    return this.prisma.sceneHandoff.update({ where: { id: handoffId }, data });
  }

  async deleteHandoff(projectId: string, handoffId: string) {
    await this.getHandoff(projectId, handoffId);
    return this.prisma.sceneHandoff.update({ where: { id: handoffId }, data: { deletedAt: new Date() } });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
  }

  private async ensureChapterBoundary(projectId: string, chapterId?: string | null) {
    assertStringField(chapterId, 'chapterId', true);
    await this.ensureProject(projectId);
    const chapter = await this.prisma.chapter.findFirst({ where: { id: chapterId!.trim(), projectId, deletedAt: null }, select: { id: true } });
    if (!chapter) throw new BadRequestException('chapterId must belong to the project');
  }

  private async ensureSceneTriplet(projectId: string, chapterId: string, sceneId: string) {
    const scene = await this.prisma.scene.findFirst({ where: { id: sceneId, projectId, chapterId, deletedAt: null }, select: { id: true } });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found in project ${projectId} chapter ${chapterId}`);
  }

  private async ensureCharacterBoundary(projectId: string, characterId?: string | null) {
    if (characterId === undefined || characterId === null) return;
    assertStringField(characterId, 'povCharacterId');
    const character = await this.prisma.character.findFirst({ where: { id: characterId.trim(), projectId, deletedAt: null }, select: { id: true } });
    if (!character) throw new BadRequestException('povCharacterId must belong to the project');
  }

  private async ensureLocationBoundary(projectId: string, locationId?: string | null) {
    if (locationId === undefined || locationId === null) return;
    assertStringField(locationId, 'primaryLocationId');
    const location = await this.prisma.location.findFirst({ where: { id: locationId.trim(), projectId, deletedAt: null }, select: { id: true } });
    if (!location) throw new BadRequestException('primaryLocationId must belong to the project');
  }

  private async ensureChapterPlanBoundary(projectId: string, chapterId: string, chapterPlanId?: string | null) {
    if (chapterPlanId === undefined || chapterPlanId === null) return;
    assertStringField(chapterPlanId, 'chapterPlanId');
    const plan = await this.prisma.chapterPlan.findFirst({ where: { id: chapterPlanId.trim(), projectId, deletedAt: null }, select: { id: true, chapterId: true } });
    if (!plan) throw new BadRequestException('chapterPlanId must belong to the project');
    if (plan.chapterId && plan.chapterId !== chapterId) throw new BadRequestException('chapterPlanId must belong to the same chapter when chapterId is set');
  }

  private async ensurePlanBoundary(projectId: string, chapterId: string, sceneId: string, planId?: string | null, required = false) {
    if (planId === undefined || planId === null) {
      if (required) throw new BadRequestException('planId is required');
      return;
    }
    assertStringField(planId, 'planId');
    const plan = await this.prisma.scenePlan.findFirst({ where: { id: planId.trim(), projectId, chapterId, sceneId, deletedAt: null }, select: { id: true } });
    if (!plan) throw new BadRequestException('planId must belong to the same project, chapter and scene');
  }

  private async ensureVersionBoundary(projectId: string, chapterId: string, sceneId: string, versionId: string | null | undefined, required: boolean, field: string) {
    if (versionId === undefined || versionId === null) {
      if (required) throw new BadRequestException(`${field} is required`);
      return;
    }
    assertStringField(versionId, field);
    const version = await this.prisma.sceneVersion.findFirst({ where: { id: versionId.trim(), projectId, chapterId, sceneId, deletedAt: null }, select: { id: true } });
    if (!version) throw new BadRequestException(`${field} must belong to the same project, chapter and scene`);
  }

  private async ensureNextSceneBoundary(projectId: string, nextSceneId?: string | null) {
    if (nextSceneId === undefined || nextSceneId === null) return;
    assertStringField(nextSceneId, 'nextSceneId');
    const nextScene = await this.prisma.scene.findFirst({ where: { id: nextSceneId.trim(), projectId, deletedAt: null }, select: { id: true } });
    if (!nextScene) throw new BadRequestException('nextSceneId must belong to the same project');
  }

  private validateSceneBody(dto: CreateSceneDto | UpdateSceneDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
    if (dto?.status !== undefined) {
      assertStringField(dto.status, 'status');
      if (!sceneStatuses.has(dto.status.trim())) throw new BadRequestException('status must be one of planned, writing, reviewing, done');
    }
    assertStringField(dto?.povCharacterId, 'povCharacterId');
    assertStringField(dto?.primaryLocationId, 'primaryLocationId');
  }

  private validatePlanBody(dto: CreateScenePlanDto | UpdateScenePlanDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertNonNegativeInteger(dto?.orderIndex, 'orderIndex');
    assertStringField(dto?.chapterPlanId, 'chapterPlanId');
  }

  private validateVersionBody(dto: CreateSceneVersionDto | UpdateSceneVersionDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertStringField(dto?.content, 'content', !requireBody);
    assertStringField(dto?.basedOnVersionId, 'basedOnVersionId');
    assertNonNegativeInteger(dto?.wordCount, 'wordCount');
  }

  private validateSummaryBody(dto: CreateSceneSummaryDto | UpdateSceneSummaryDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertStringField(dto?.summary, 'summary', !requireBody);
    assertStringField(dto?.sceneVersionId, 'sceneVersionId');
  }

  private validateHandoffBody(dto: CreateSceneHandoffDto | UpdateSceneHandoffDto, requireBody: boolean) {
    if (requireBody) assertNonEmptyBody(dto);
    assertStringField(dto?.sceneVersionId, 'sceneVersionId');
    assertStringField(dto?.nextSceneId, 'nextSceneId');
  }

  private normalizeSceneData(data: SceneData) {
    return pickAllowedFields(
      data,
      ['title', 'goal', 'orderIndex', 'status', 'storyTimeLabel', 'povCharacterId', 'primaryLocationId', 'sourceType', 'sourceId'],
      ['title', 'goal', 'status', 'storyTimeLabel', 'povCharacterId', 'primaryLocationId', 'sourceType', 'sourceId'],
    );
  }

  private normalizePlanData(data: PlanData) {
    return pickAllowedFields(
      data,
      [
        'chapterPlanId',
        'title',
        'goal',
        'outline',
        'conflict',
        'choice',
        'consequence',
        'readerPromise',
        'readerPayoff',
        'nextHook',
        'constraints',
        'orderIndex',
        'sourceType',
        'sourceId',
      ],
      [
        'chapterPlanId',
        'title',
        'goal',
        'outline',
        'conflict',
        'choice',
        'consequence',
        'readerPromise',
        'readerPayoff',
        'nextHook',
        'sourceType',
        'sourceId',
      ],
    );
  }

  private normalizeVersionData(data: VersionData) {
    return pickAllowedFields(
      data,
      ['source', 'sourceType', 'sourceId', 'content', 'wordCount', 'changeSummary', 'basedOnVersionId'],
      ['source', 'sourceType', 'sourceId', 'content', 'changeSummary', 'basedOnVersionId'],
    );
  }

  private normalizeSummaryData(data: SummaryData) {
    return pickAllowedFields(
      data,
      [
        'sceneVersionId',
        'summary',
        'keyEvents',
        'characterChanges',
        'locationChanges',
        'factionChanges',
        'worldRuleChanges',
        'newFacts',
        'readerVisibleInfo',
        'createdBy',
        'sourceType',
        'sourceId',
      ],
      ['sceneVersionId', 'summary', 'createdBy', 'sourceType', 'sourceId'],
    );
  }

  private normalizeHandoffData(data: HandoffData) {
    return pickAllowedFields(
      data,
      [
        'sceneVersionId',
        'nextSceneId',
        'readerKnows',
        'actualChanges',
        'openQuestions',
        'promisesOpened',
        'promisesClosed',
        'nextSceneMust',
        'riskNotes',
        'createdBy',
        'sourceType',
        'sourceId',
      ],
      ['sceneVersionId', 'nextSceneId', 'createdBy', 'sourceType', 'sourceId'],
    );
  }

  private countWords(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    const cjk = trimmed.match(/[㐀-鿿]/g)?.length ?? 0;
    const nonCjkWords = trimmed.replace(/[㐀-鿿]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    return cjk + nonCjkWords;
  }

  private buildReadiness(
    scene: SceneBoundary,
    currentPlan: { goal?: string | null; outline?: string | null; conflict?: string | null; choice?: string | null; consequence?: string | null; readerPayoff?: string | null } | null,
    latestSummary: unknown,
    latestHandoff: unknown,
    povCharacter: unknown,
    primaryLocation: unknown,
    previousScene: unknown,
    previousHandoff: unknown,
  ) {
    const items: ReadinessItem[] = [
      { key: 'povCharacter', ready: Boolean(povCharacter), message: 'Scene should have a valid POV character.' },
      { key: 'primaryLocation', ready: Boolean(primaryLocation), message: 'Scene should have a valid primary location.' },
      { key: 'currentPlan', ready: Boolean(currentPlan), message: 'Scene should have an active plan before writing.' },
      { key: 'goal', ready: Boolean(currentPlan?.goal?.trim()), message: 'Scene plan should state the character or scene goal.' },
      { key: 'outline', ready: Boolean(currentPlan?.outline?.trim()), message: 'Scene plan should outline the intended action.' },
      { key: 'conflict', ready: Boolean(currentPlan?.conflict?.trim()), message: 'Scene plan should include an obstacle or conflict.' },
      { key: 'choice', ready: Boolean(currentPlan?.choice?.trim()), message: 'Scene plan should include a meaningful choice.' },
      { key: 'consequence', ready: Boolean(currentPlan?.consequence?.trim()), message: 'Scene plan should include consequences.' },
      { key: 'readerPayoff', ready: Boolean(currentPlan?.readerPayoff?.trim()), message: 'Scene plan should include reader payoff.' },
      { key: 'previousHandoff', ready: !previousScene || Boolean(previousHandoff), message: 'Scene should acknowledge the previous scene handoff when there is a previous scene.' },
    ];
    const missing = items.filter((item) => !item.ready);
    const contextWarnings = [
      ...(latestSummary ? [] : ['Scene has no confirmed summary available for context.']),
      ...(latestHandoff ? [] : ['Scene has no confirmed handoff available for context.']),
    ];
    return {
      ready: missing.length === 0,
      score: items.length - missing.length,
      total: items.length,
      items,
      warnings: [...missing.map((item) => item.message), ...contextWarnings],
    };
  }
}

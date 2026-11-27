import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { GeneratedDraftStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ChaptersService } from '../chapters/chapters.service';
import { ScenesService } from '../scenes/scenes.service';
import { ApplyAiDraftDto } from './dto/apply-ai-draft.dto';
import { CreateAiDraftDto } from './dto/create-ai-draft.dto';
import { RegenerateAiDraftDto } from './dto/regenerate-ai-draft.dto';
import { UpdateAiDraftDto } from './dto/update-ai-draft.dto';

type DraftListQuery = { targetType?: string; targetId?: string; status?: string };
type JsonRecord = Record<string, unknown>;
type TxClient = Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

const draftStatuses = new Set<string>(Object.values(GeneratedDraftStatus));
const supportedApplyTargets = new Set(['chapter_version', 'scene_version', 'scene_plan', 'chapter_summary']);

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty');
}

function trimOptional(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredTrimmed(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) throw new BadRequestException(`${field} is required`);
  return value.trim();
}

function jsonObject(value: unknown, field = 'payload'): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException(`${field} must be an object`);
  return value as JsonRecord;
}

function optionalStringFromPayload(payload: JsonRecord, field: string) {
  const value = payload[field];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function nullableStringFromPayload(payload: JsonRecord, field: string) {
  const value = payload[field];
  return typeof value === 'string' ? value.trim() || null : undefined;
}

@Injectable()
export class AiDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chaptersService?: ChaptersService,
    private readonly scenesService?: ScenesService,
  ) {}

  async listDrafts(projectId: string, query: DraftListQuery = {}) {
    await this.ensureProject(projectId);
    const status = query.status ? this.normalizeStatus(query.status) : undefined;
    return this.prisma.generatedDraft.findMany({
      where: {
        projectId,
        deletedAt: null,
        targetType: query.targetType?.trim() || undefined,
        targetId: query.targetId?.trim() || undefined,
        status,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createDraft(projectId: string, dto: CreateAiDraftDto) {
    assertNonEmptyBody(dto);
    await this.ensureProject(projectId);
    await this.ensurePreviousDraftBoundary(projectId, dto.previousDraftId);
    await this.ensureSourceTaskBoundary(projectId, dto.sourceTaskId);

    return this.prisma.generatedDraft.create({
      data: {
        projectId,
        targetType: requiredTrimmed(dto.targetType, 'targetType'),
        targetId: trimOptional(dto.targetId),
        draftType: requiredTrimmed(dto.draftType, 'draftType'),
        payload: jsonObject(dto.payload) as Prisma.InputJsonValue,
        textPreview: trimOptional(dto.textPreview),
        sourceTaskId: trimOptional(dto.sourceTaskId),
        feedback: trimOptional(dto.feedback),
        previousDraftId: trimOptional(dto.previousDraftId),
        status: GeneratedDraftStatus.pending,
      },
    });
  }

  async getDraft(projectId: string, draftId: string) {
    const draft = await this.prisma.generatedDraft.findFirst({ where: { id: draftId.trim(), projectId, deletedAt: null } });
    if (!draft) throw new NotFoundException(`GeneratedDraft ${draftId} not found in project ${projectId}`);
    return draft;
  }

  async updateDraft(projectId: string, draftId: string, dto: UpdateAiDraftDto) {
    assertNonEmptyBody(dto);
    const draft = await this.getPendingDraft(projectId, draftId);
    const data: Prisma.GeneratedDraftUpdateInput = {};
    if (Object.prototype.hasOwnProperty.call(dto, 'payload')) data.payload = jsonObject(dto.payload) as Prisma.InputJsonValue;
    if (Object.prototype.hasOwnProperty.call(dto, 'textPreview')) data.textPreview = trimOptional(dto.textPreview);
    if (Object.prototype.hasOwnProperty.call(dto, 'feedback')) data.feedback = trimOptional(dto.feedback);
    if (Object.keys(data).length === 0) throw new BadRequestException('request body must include at least one writable field');
    return this.prisma.generatedDraft.update({ where: { id: draft.id }, data });
  }

  async discardDraft(projectId: string, draftId: string) {
    const draft = await this.getPendingDraft(projectId, draftId);
    return this.prisma.generatedDraft.update({
      where: { id: draft.id },
      data: { status: GeneratedDraftStatus.discarded, discardedAt: new Date() },
    });
  }

  async applyDraft(projectId: string, draftId: string, dto: ApplyAiDraftDto = {}) {
    const draft = await this.getPendingDraft(projectId, draftId);
    if (!supportedApplyTargets.has(draft.targetType)) {
      throw new BadRequestException(`Applying targetType ${draft.targetType} is not supported in AI Draft P1`);
    }

    const applied = await this.applyToTarget(this.prisma as unknown as TxClient, draft, dto);
    return this.prisma.generatedDraft.update({
      where: { id: draft.id },
      data: {
        status: GeneratedDraftStatus.applied,
        appliedTargetType: applied.type,
        appliedTargetId: applied.id,
        appliedAt: new Date(),
      },
    });
  }

  async regenerateDraft(projectId: string, draftId: string, dto: RegenerateAiDraftDto = {}) {
    const draft = await this.getPendingDraft(projectId, draftId);
    const feedback = dto.feedback?.trim() || draft.feedback?.trim() || null;
    if (!feedback) throw new BadRequestException('feedback is required to create a regenerated mock draft');

    return this.prisma.$transaction(async (tx) => {
      const client = tx as unknown as TxClient;
      await client.generatedDraft.update({
        where: { id: draft.id },
        data: { status: GeneratedDraftStatus.superseded, supersededAt: new Date(), feedback },
      });
      return client.generatedDraft.create({
        data: {
          projectId,
          targetType: draft.targetType,
          targetId: draft.targetId,
          draftType: draft.draftType,
          payload: draft.payload as Prisma.InputJsonValue,
          textPreview: `基于反馈创建新草稿（P1 mock，未调用 AI）：${feedback}`,
          sourceTaskId: draft.sourceTaskId,
          feedback,
          previousDraftId: draft.id,
          status: GeneratedDraftStatus.pending,
        },
      });
    });
  }

  private async applyToTarget(client: TxClient, draft: Awaited<ReturnType<AiDraftsService['getDraft']>>, dto: ApplyAiDraftDto) {
    if (draft.targetType === 'chapter_version') return this.applyChapterVersion(client, draft, dto);
    if (draft.targetType === 'scene_version') return this.applySceneVersion(client, draft, dto);
    if (draft.targetType === 'scene_plan') return this.applyScenePlan(client, draft, dto);
    if (draft.targetType === 'chapter_summary') return this.applyChapterSummary(client, draft);
    throw new BadRequestException(`Applying targetType ${draft.targetType} is not supported in AI Draft P1`);
  }

  private async applyChapterVersion(client: TxClient, draft: Awaited<ReturnType<AiDraftsService['getDraft']>>, dto: ApplyAiDraftDto) {
    const chapter = await this.ensureChapterBoundary(client, draft.projectId, draft.targetId, 'chapter_version targetId');
    const payload = jsonObject(draft.payload);
    const content = requiredTrimmed(payload.content, 'payload.content');
    if (this.chaptersService) {
      const version = await this.chaptersService.createVersion(draft.projectId, chapter.id, { content, source: 'ai', changeSummary: optionalStringFromPayload(payload, 'changeSummary') ?? draft.textPreview ?? 'applied from AI draft' });
      if (dto.activate === true) await this.chaptersService.activateVersion(draft.projectId, chapter.id, version.id);
      return { type: 'chapter_version', id: version.id };
    }
    const version = await client.chapterVersion.create({
      data: {
        chapterId: chapter.id,
        source: 'ai',
        content,
        changeSummary: optionalStringFromPayload(payload, 'changeSummary') ?? draft.textPreview ?? 'applied from AI draft',
      },
    });
    if (dto.activate === true) {
      await client.chapter.update({ where: { id: chapter.id }, data: { currentVersionId: version.id } });
    }
    return { type: 'chapter_version', id: version.id };
  }

  private async applySceneVersion(client: TxClient, draft: Awaited<ReturnType<AiDraftsService['getDraft']>>, dto: ApplyAiDraftDto) {
    const scene = await this.ensureSceneBoundary(client, draft.projectId, draft.targetId, 'scene_version targetId');
    const payload = jsonObject(draft.payload);
    const content = requiredTrimmed(payload.content, 'payload.content');
    if (this.scenesService) {
      const version = await this.scenesService.createVersion(draft.projectId, scene.id, {
        content,
        source: 'ai',
        sourceType: 'generated_draft',
        sourceId: draft.id,
        wordCount: typeof payload.wordCount === 'number' ? payload.wordCount : this.countWords(content),
        changeSummary: optionalStringFromPayload(payload, 'changeSummary') ?? draft.textPreview ?? 'applied from AI draft',
        basedOnVersionId: nullableStringFromPayload(payload, 'basedOnVersionId') ?? undefined,
      });
      if (dto.activate === true) await this.scenesService.activateVersion(draft.projectId, scene.id, version.id);
      return { type: 'scene_version', id: version.id };
    }
    const version = await client.sceneVersion.create({
      data: {
        projectId: draft.projectId,
        chapterId: scene.chapterId,
        sceneId: scene.id,
        source: 'ai',
        sourceType: 'generated_draft',
        sourceId: draft.id,
        content,
        wordCount: typeof payload.wordCount === 'number' ? payload.wordCount : this.countWords(content),
        changeSummary: optionalStringFromPayload(payload, 'changeSummary') ?? draft.textPreview ?? 'applied from AI draft',
        basedOnVersionId: nullableStringFromPayload(payload, 'basedOnVersionId'),
      },
    });
    if (dto.activate === true) {
      await client.scene.update({ where: { id: scene.id }, data: { currentVersionId: version.id } });
    }
    return { type: 'scene_version', id: version.id };
  }

  private async applyScenePlan(client: TxClient, draft: Awaited<ReturnType<AiDraftsService['getDraft']>>, dto: ApplyAiDraftDto) {
    const scene = await this.ensureSceneBoundary(client, draft.projectId, draft.targetId, 'scene_plan targetId');
    const payload = jsonObject(draft.payload);
    if (this.scenesService) {
      const plan = await this.scenesService.createPlan(draft.projectId, scene.id, {
        chapterPlanId: nullableStringFromPayload(payload, 'chapterPlanId') ?? undefined,
        title: nullableStringFromPayload(payload, 'title') ?? undefined,
        goal: nullableStringFromPayload(payload, 'goal') ?? undefined,
        outline: nullableStringFromPayload(payload, 'outline') ?? undefined,
        conflict: nullableStringFromPayload(payload, 'conflict') ?? undefined,
        choice: nullableStringFromPayload(payload, 'choice') ?? undefined,
        consequence: nullableStringFromPayload(payload, 'consequence') ?? undefined,
        readerPromise: nullableStringFromPayload(payload, 'readerPromise') ?? undefined,
        readerPayoff: nullableStringFromPayload(payload, 'readerPayoff') ?? undefined,
        nextHook: nullableStringFromPayload(payload, 'nextHook') ?? undefined,
        constraints: (payload.constraints && typeof payload.constraints === 'object' ? payload.constraints : undefined) as Prisma.InputJsonValue | undefined,
        orderIndex: typeof payload.orderIndex === 'number' ? payload.orderIndex : undefined,
        sourceType: 'generated_draft',
        sourceId: draft.id,
      });
      if (dto.activate === true) await this.scenesService.activatePlan(draft.projectId, scene.id, plan.id);
      return { type: 'scene_plan', id: plan.id };
    }
    const plan = await client.scenePlan.create({
      data: {
        projectId: draft.projectId,
        chapterId: scene.chapterId,
        sceneId: scene.id,
        chapterPlanId: nullableStringFromPayload(payload, 'chapterPlanId'),
        title: nullableStringFromPayload(payload, 'title'),
        goal: nullableStringFromPayload(payload, 'goal'),
        outline: nullableStringFromPayload(payload, 'outline'),
        conflict: nullableStringFromPayload(payload, 'conflict'),
        choice: nullableStringFromPayload(payload, 'choice'),
        consequence: nullableStringFromPayload(payload, 'consequence'),
        readerPromise: nullableStringFromPayload(payload, 'readerPromise'),
        readerPayoff: nullableStringFromPayload(payload, 'readerPayoff'),
        nextHook: nullableStringFromPayload(payload, 'nextHook'),
        constraints: (payload.constraints && typeof payload.constraints === 'object' ? payload.constraints : undefined) as Prisma.InputJsonValue | undefined,
        orderIndex: typeof payload.orderIndex === 'number' ? payload.orderIndex : 0,
        canonStatus: 'draft',
        sourceType: 'generated_draft',
        sourceId: draft.id,
      },
    });
    if (dto.activate === true) {
      await client.scene.update({ where: { id: scene.id }, data: { currentPlanId: plan.id } });
    }
    return { type: 'scene_plan', id: plan.id };
  }

  private async applyChapterSummary(client: TxClient, draft: Awaited<ReturnType<AiDraftsService['getDraft']>>) {
    const chapter = await this.ensureChapterBoundary(client, draft.projectId, draft.targetId, 'chapter_summary targetId');
    const payload = jsonObject(draft.payload);
    const summary = requiredTrimmed(payload.summary, 'payload.summary');
    if (this.chaptersService) {
      const row = await this.chaptersService.createSummary(draft.projectId, chapter.id, {
        chapterVersionId: nullableStringFromPayload(payload, 'chapterVersionId') ?? undefined,
        summary,
        keyEvents: payload.keyEvents as Prisma.InputJsonValue | undefined,
        characterChanges: payload.characterChanges as Prisma.InputJsonValue | undefined,
        newFacts: payload.newFacts as Prisma.InputJsonValue | undefined,
        createdBy: 'ai_draft',
        sourceType: 'generated_draft',
        sourceId: draft.id,
      });
      return { type: 'chapter_summary', id: row.id };
    }
    const row = await client.chapterSummary.create({
      data: {
        projectId: draft.projectId,
        chapterId: chapter.id,
        chapterVersionId: nullableStringFromPayload(payload, 'chapterVersionId'),
        summary,
        keyEvents: payload.keyEvents as Prisma.InputJsonValue | undefined,
        characterChanges: payload.characterChanges as Prisma.InputJsonValue | undefined,
        newFacts: payload.newFacts as Prisma.InputJsonValue | undefined,
        canonStatus: 'draft',
        createdBy: 'ai_draft',
        sourceType: 'generated_draft',
        sourceId: draft.id,
      },
    });
    return { type: 'chapter_summary', id: row.id };
  }

  private async getPendingDraft(projectId: string, draftId: string) {
    const draft = await this.getDraft(projectId, draftId);
    if (draft.status !== GeneratedDraftStatus.pending) throw new BadRequestException(`GeneratedDraft ${draftId} is ${draft.status}; only pending drafts can be changed`);
    return draft;
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    return project;
  }

  private async ensurePreviousDraftBoundary(projectId: string, previousDraftId?: string | null) {
    const normalized = trimOptional(previousDraftId);
    if (!normalized) return;
    await this.getDraft(projectId, normalized);
  }

  private async ensureSourceTaskBoundary(projectId: string, sourceTaskId?: string | null) {
    const normalized = trimOptional(sourceTaskId);
    if (!normalized) return;
    const task = await this.prisma.generationTask.findFirst({ where: { id: normalized, projectId } });
    if (!task) throw new BadRequestException(`sourceTaskId ${normalized} does not belong to project ${projectId}`);
  }

  private async ensureChapterBoundary(client: TxClient, projectId: string, chapterId: string | null, label: string) {
    const id = requiredTrimmed(chapterId, label);
    const chapter = await client.chapter.findFirst({ where: { id, projectId, deletedAt: null } });
    if (!chapter) throw new BadRequestException(`${label} ${id} does not belong to project ${projectId}`);
    return chapter;
  }

  private async ensureSceneBoundary(client: TxClient, projectId: string, sceneId: string | null, label: string) {
    const id = requiredTrimmed(sceneId, label);
    const scene = await client.scene.findFirst({ where: { id, projectId, deletedAt: null } });
    if (!scene) throw new BadRequestException(`${label} ${id} does not belong to project ${projectId}`);
    return scene;
  }

  private normalizeStatus(status: string) {
    const normalized = status.trim();
    if (!draftStatuses.has(normalized)) throw new BadRequestException(`Unsupported draft status: ${status}`);
    return normalized as GeneratedDraftStatus;
  }

  private countWords(content: string) {
    const compact = content.replace(/\s+/g, '');
    return compact.length;
  }
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Empty, Form, Notification, Popconfirm, Select, SideSheet, Skeleton, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconDelete, IconEdit, IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import { useUnsavedChangesGuard } from '../../shared/hooks/useUnsavedChangesGuard';
import { readInitialNovelLocation, updateNovelLocation } from '../../shared/navigation/workspaceLocation';
import { StatusTag, statusOptions } from '../../shared/ui/StatusTag';
import { applyAiDraft, discardAiDraft, listAiDrafts, regenerateAiDraft, updateAiDraft } from '../ai-drafts/api';
import type { GeneratedDraft } from '../ai-drafts/types';
import { listCharacters, listLocations } from '../projects/api';
import type { Character, Location } from '../projects/types';
import {
  activateScenePlan,
  activateSceneVersion,
  archiveSceneHandoff,
  archiveSceneSummary,
  confirmSceneHandoff,
  confirmSceneSummary,
  createScene,
  createSceneHandoff,
  createScenePlan,
  createSceneSummary,
  createSceneVersion,
  deleteScene,
  deleteSceneHandoff,
  deleteScenePlan,
  deleteSceneSummary,
  deleteSceneVersion,
  getSceneProfile,
  listSceneHandoffs,
  listScenePlans,
  listScenes,
  listSceneSummaries,
  listSceneVersions,
  restoreSceneHandoff,
  restoreSceneSummary,
  updateScene,
  updateSceneHandoff,
  updateScenePlan,
  updateSceneSummary,
  updateSceneVersion,
} from '../scenes/api';
import type { Scene, SceneHandoff, SceneHandoffInput, SceneInput, ScenePlan, ScenePlanInput, SceneProfile, SceneSummary, SceneSummaryInput, SceneVersion, SceneVersionInput } from '../scenes/types';
import { activateChapterVersion, archiveChapterSummary, assembleChapterFromScenes, confirmChapterSummary, createChapter, createChapterSummary, createChapterVersion, deleteChapter, deleteChapterSummary, getChapterProfile, listChapters, restoreChapterSummary, rollupChapterSummaryFromScenes, updateChapter, updateChapterSummary } from './api';
import type { AssembleChapterInput, Chapter, ChapterInput, ChapterProfile, ChapterSummary, ChapterSummaryInput, ChapterVersion } from './types';

const { Title, Text, Paragraph } = Typography;
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type EditingChapterState = { mode: 'create' } | { mode: 'edit'; chapter: Chapter };
type EditingSceneState = { mode: 'create' } | { mode: 'edit'; scene: Scene };
type EditingSummaryState = { mode: 'create' } | { mode: 'edit'; summary: ChapterSummary };
type EditingAiDraftState = { draft: GeneratedDraft; payloadText: string; textPreview: string; feedback: string };
type DetailTab = 'flow' | 'body' | 'summaries' | 'versions' | 'overview';
type SceneDetailTab = 'plan' | 'version' | 'summary' | 'handoff';
type SceneResourceKind = 'plan' | 'version' | 'summary' | 'handoff';
type SceneResourceItem = ScenePlan | SceneVersion | SceneSummary | SceneHandoff;
type EditingSceneResourceState = { kind: SceneResourceKind; mode: 'create' } | { kind: SceneResourceKind; mode: 'edit'; item: SceneResourceItem };
type SceneProgress = {
  scenes: Scene[];
  profiles: Record<string, SceneProfile | undefined>;
  sceneCount: number;
  currentVersionCount: number;
  confirmedSummaryCount: number;
  confirmedHandoffCount: number;
  hardBlockers: WritingIssue[];
  softWarnings: WritingIssue[];
};
type WritingIssue = { key: string; message: string; sceneId?: string; target: DetailTab | SceneDetailTab };

type NextSuggestion =
  | { kind: 'createScene'; label: string }
  | { kind: 'sceneTask'; label: string; sceneId: string; sceneTab: SceneDetailTab }
  | { kind: 'assembleChapter'; label: string }
  | { kind: 'rollupSummary'; label: string }
  | { kind: 'chapterComplete'; label: string };

type SelectOption = { label: string; value: string };

const chapterStatusOptions = statusOptions(['draft', 'generating', 'reviewing', 'done', 'archived'] as const);
const sceneStatusOptions = statusOptions(['planned', 'writing', 'reviewing', 'done'] as const);
const sceneSourceOptions = [
  { label: '手动记录', value: 'user' },
  { label: '导入内容', value: 'imported' },
  { label: '智能辅助', value: 'ai' },
];
const detailTabs: DetailTab[] = ['flow', 'body', 'summaries', 'versions', 'overview'];
const sceneTabs: SceneDetailTab[] = ['plan', 'version', 'summary', 'handoff'];
const resourceTitle: Record<SceneResourceKind, string> = { plan: '场景计划', version: '场景正文版本', summary: '场景摘要', handoff: '场景交接' };

export function ChapterWorkspace({ projectId }: { projectId: string }) {
  const initialLocation = useMemo(() => readInitialNovelLocation(), []);
  const initialMatchesProject = initialLocation.projectId === projectId;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | undefined>(() => initialMatchesProject ? initialLocation.chapterId : undefined);
  const [profile, setProfile] = useState<ChapterProfile>();
  const [activeTab, setActiveTab] = useState<DetailTab>(() => initialMatchesProject ? initialLocation.chapterTab ?? 'flow' : 'flow');
  const [sceneTab, setSceneTab] = useState<SceneDetailTab>(() => initialMatchesProject ? initialLocation.sceneTab ?? 'plan' : 'plan');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [progressLoading, setProgressLoading] = useState(false);
  const [chapterProgress, setChapterProgress] = useState<Record<string, SceneProgress>>({});
  const [chapterScenes, setChapterScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | undefined>(() => initialMatchesProject ? initialLocation.sceneId : undefined);
  const [selectedSceneProfile, setSelectedSceneProfile] = useState<SceneProfile>();
  const [sceneProfiles, setSceneProfiles] = useState<Record<string, SceneProfile | undefined>>({});
  const [scenePlans, setScenePlans] = useState<ScenePlan[]>([]);
  const [sceneVersions, setSceneVersions] = useState<SceneVersion[]>([]);
  const [sceneSummaries, setSceneSummaries] = useState<SceneSummary[]>([]);
  const [sceneHandoffs, setSceneHandoffs] = useState<SceneHandoff[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingChapter, setEditingChapter] = useState<EditingChapterState>();
  const [editingScene, setEditingScene] = useState<EditingSceneState>();
  const [editingSceneResource, setEditingSceneResource] = useState<EditingSceneResourceState>();
  const [editingSummary, setEditingSummary] = useState<EditingSummaryState>();
  const [aiDrafts, setAiDrafts] = useState<GeneratedDraft[]>([]);
  const [aiDraftsLoading, setAiDraftsLoading] = useState(false);
  const [editingAiDraft, setEditingAiDraft] = useState<EditingAiDraftState>();
  const [draftActionBusy, setDraftActionBusy] = useState<string>();
  const [applyDraftActivate, setApplyDraftActivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();
  const [sceneFormApi, setSceneFormApi] = useState<FormApi>();
  const [resourceFormApi, setResourceFormApi] = useState<FormApi>();
  const [summarySaving, setSummarySaving] = useState(false);
  const [summaryFormApi, setSummaryFormApi] = useState<FormApi>();
  const [rollingUpSummary, setRollingUpSummary] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [saveAndActivate, setSaveAndActivate] = useState(true);
  const [savingVersion, setSavingVersion] = useState(false);
  const [includeSceneTitles, setIncludeSceneTitles] = useState(false);
  const [assembleActivate, setAssembleActivate] = useState(true);
  const [assembling, setAssembling] = useState(false);
  const [sceneFilter, setSceneFilter] = useState<'all' | 'blocked' | 'no-body' | 'no-summary' | 'no-handoff'>('all');
  const [inlineError, setInlineError] = useState<{ title: string; message: string }>();
  const [resourceSaveError, setResourceSaveError] = useState<{ title: string; message: string }>();
  const unsavedGuard = useUnsavedChangesGuard();

  const selectedChapter = useMemo(() => chapters.find((chapter) => chapter.id === selectedChapterId), [chapters, selectedChapterId]);
  const selectedScene = useMemo(() => chapterScenes.find((scene) => scene.id === selectedSceneId), [chapterScenes, selectedSceneId]);
  const currentVersion = profile?.currentVersion;
  const currentProgress = selectedChapterId ? chapterProgress[selectedChapterId] : undefined;
  const nextOrderIndex = useMemo(() => chapters.reduce((max, chapter) => Math.max(max, chapter.orderIndex), -1) + 1, [chapters]);
  const nextSceneOrderIndex = useMemo(() => chapterScenes.reduce((max, scene) => Math.max(max, scene.orderIndex), -1) + 1, [chapterScenes]);
  const sceneOptions = useMemo(() => chapterScenes.map((scene) => ({ value: scene.id, label: scene.title || `场景 #${scene.orderIndex}` })), [chapterScenes]);
  const characterOptions = useMemo(() => characters.map((character) => ({ value: character.id, label: character.name })), [characters]);
  const locationOptions = useMemo(() => locations.map((location) => ({ value: location.id, label: location.name })), [locations]);
  const relevantAiDrafts = useMemo(() => filterRelevantDrafts(aiDrafts, selectedChapterId, selectedSceneId), [aiDrafts, selectedChapterId, selectedSceneId]);

  const refreshChapters = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listChapters(projectId);
      setChapters(items);
      setSelectedChapterId((current) => current && items.some((chapter) => chapter.id === current) ? current : items[0]?.id);
      void refreshAllChapterProgress(items);
    } catch (error) {
      setChapters([]);
      setSelectedChapterId(undefined);
      Notification.error({ title: '章节加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshProfile = useCallback(async (chapterId: string) => {
    setProfileLoading(true);
    try {
      const nextProfile = await getChapterProfile(projectId, chapterId);
      setProfile(nextProfile);
      setDraftContent(nextProfile.currentVersion?.content ?? '');
      setDraftSummary('');
    } catch (error) {
      setProfile(undefined);
      Notification.error({ title: '章节详情加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setProfileLoading(false);
    }
  }, [projectId]);

  const refreshSelectedChapterScenes = useCallback(async (chapterId: string, preferredSceneId?: string) => {
    setProgressLoading(true);
    try {
      const scenes = await listScenes(projectId, chapterId);
      const profiles = await loadSceneProfiles(projectId, scenes);
      const nextProgress = buildSceneProgress(scenes, profiles, Boolean(profile?.currentSummary));
      setChapterScenes(scenes);
      setSceneProfiles(profiles);
      setChapterProgress((current) => ({ ...current, [chapterId]: nextProgress }));
      const nextSelected = preferredSceneId && scenes.some((scene) => scene.id === preferredSceneId)
        ? preferredSceneId
        : selectedSceneId && scenes.some((scene) => scene.id === selectedSceneId)
          ? selectedSceneId
          : scenes[0]?.id;
      setSelectedSceneId(nextSelected);
    } catch (error) {
      setChapterScenes([]);
      setSceneProfiles({});
      setSelectedSceneId(undefined);
      Notification.error({ title: '本章场景加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setProgressLoading(false);
    }
  }, [profile?.currentSummary, projectId, selectedSceneId]);

  async function refreshAllChapterProgress(items = chapters) {
    try {
      const entries = await Promise.all(items.map(async (chapter) => {
        const [chapterProfile, scenes] = await Promise.all([getChapterProfile(projectId, chapter.id).catch(() => undefined), listScenes(projectId, chapter.id).catch(() => [])]);
        const profiles = await loadSceneProfiles(projectId, scenes);
        return [chapter.id, buildSceneProgress(scenes, profiles, Boolean(chapterProfile?.currentSummary))] as const;
      }));
      setChapterProgress(Object.fromEntries(entries));
    } catch {
      // 单章详情会展示具体错误；左侧进度失败时保持已有数据。
    }
  }

  useEffect(() => {
    updateNovelLocation({
      app: 'shelf',
      view: 'workspace',
      projectId,
      section: 'chapters',
      chapterId: selectedChapterId,
      chapterTab: activeTab,
      sceneId: selectedSceneId,
      sceneTab,
    });
  }, [activeTab, projectId, sceneTab, selectedChapterId, selectedSceneId]);

  useEffect(() => { refreshChapters(); }, [refreshChapters]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCharacters(projectId), listLocations(projectId)])
      .then(([characterData, locationData]) => {
        if (cancelled) return;
        setCharacters(itemsFromResponse<Character>(characterData));
        setLocations(itemsFromResponse<Location>(locationData));
      })
      .catch(() => {
        if (cancelled) return;
        setCharacters([]);
        setLocations([]);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  useEffect(() => {
    if (selectedChapterId) {
      refreshProfile(selectedChapterId);
      refreshSelectedChapterScenes(selectedChapterId);
    } else {
      setProfile(undefined);
      setDraftContent('');
      setChapterScenes([]);
      setSelectedSceneId(undefined);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshProfile, selectedChapterId]);

  useEffect(() => {
    if (!selectedSceneId) {
      setSelectedSceneProfile(undefined);
      setScenePlans([]);
      setSceneVersions([]);
      setSceneSummaries([]);
      setSceneHandoffs([]);
      return;
    }
    refreshSelectedSceneDetail(selectedSceneId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSceneId]);

  async function refreshSelectedSceneDetail(sceneId = selectedSceneId) {
    if (!sceneId) return;
    try {
      const [sceneProfile, plans, versions, summaries, handoffs] = await Promise.all([
        getSceneProfile(projectId, sceneId),
        listScenePlans(projectId, sceneId),
        listSceneVersions(projectId, sceneId),
        listSceneSummaries(projectId, sceneId),
        listSceneHandoffs(projectId, sceneId),
      ]);
      setSelectedSceneProfile(sceneProfile);
      setScenePlans(plans);
      setSceneVersions(versions);
      setSceneSummaries(summaries);
      setSceneHandoffs(handoffs);
      setSceneProfiles((current) => ({ ...current, [sceneId]: sceneProfile }));
    } catch (error) {
      Notification.error({ title: '场景详情加载失败', content: String((error as Error).message ?? error) });
    }
  }

  const refreshAiDrafts = useCallback(async () => {
    setAiDraftsLoading(true);
    try {
      const drafts = await listAiDrafts(projectId, { status: 'pending' });
      setAiDrafts(drafts);
    } catch (error) {
      setAiDrafts([]);
      Notification.error({ title: 'AI 草稿加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setAiDraftsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { refreshAiDrafts(); }, [refreshAiDrafts]);

  async function refreshAfterSceneChange(preferredSceneId?: string) {
    if (!selectedChapter) return;
    await Promise.all([refreshProfile(selectedChapter.id), refreshSelectedChapterScenes(selectedChapter.id, preferredSceneId), refreshAllChapterProgress(), refreshAiDrafts()]);
    if (preferredSceneId) await refreshSelectedSceneDetail(preferredSceneId);
  }

  async function saveChapter() {
    if (!formApi || !editingChapter) return;
    setSaving(true);
    try {
      const values = await formApi.validate() as Record<string, unknown>;
      const input = normalizeChapterInput(values, editingChapter.mode === 'create');
      const saved = await (editingChapter.mode === 'create' ? createChapter(projectId, input) : updateChapter(projectId, editingChapter.chapter.id, input));
      Notification.success({ title: '章节已保存' });
      unsavedGuard.resetDirty('chapter');
      setEditingChapter(undefined);
      setSelectedChapterId(saved.id);
      await refreshChapters();
    } catch (error) {
      Notification.error({ title: '章节保存失败', content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteChapter(chapter: Chapter) {
    try {
      await deleteChapter(projectId, chapter.id);
      Notification.success({ title: '章节已删除' });
      if (selectedChapterId === chapter.id) setSelectedChapterId(undefined);
      await refreshChapters();
    } catch (error) {
      Notification.error({ title: '章节删除失败', content: String((error as Error).message ?? error) });
    }
  }

  async function saveScene() {
    if (!sceneFormApi || !editingScene || !selectedChapter) return;
    setSaving(true);
    try {
      const values = await sceneFormApi.validate() as Record<string, unknown>;
      const input = normalizeSceneInput(values);
      const saved = editingScene.mode === 'create' ? await createScene(projectId, selectedChapter.id, input) : await updateScene(projectId, editingScene.scene.id, input);
      Notification.success({ title: '场景已保存' });
      unsavedGuard.resetDirty('scene');
      setEditingScene(undefined);
      await refreshAfterSceneChange(saved.id);
    } catch (error) {
      Notification.error({ title: '场景保存失败', content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteScene(scene: Scene) {
    try {
      await deleteScene(projectId, scene.id);
      Notification.success({ title: '场景已删除' });
      await refreshAfterSceneChange();
    } catch (error) {
      Notification.error({ title: '场景删除失败', content: String((error as Error).message ?? error) });
    }
  }

  async function saveSceneResource() {
    if (!resourceFormApi || !editingSceneResource || !selectedScene) return;
    setSaving(true);
    setResourceSaveError(undefined);
    try {
      const values = await resourceFormApi.validate() as Record<string, unknown>;
      const result = await saveResource(projectId, selectedScene.id, editingSceneResource, values, selectedSceneProfile?.scene.currentVersionId);
      if ((editingSceneResource.kind === 'plan' || editingSceneResource.kind === 'version') && editingSceneResource.mode === 'create') {
        if (editingSceneResource.kind === 'plan') await activateScenePlan(projectId, selectedScene.id, result.id);
        if (editingSceneResource.kind === 'version') await activateSceneVersion(projectId, selectedScene.id, result.id);
      }
      Notification.success({ title: `${resourceTitle[editingSceneResource.kind]}已保存` });
      unsavedGuard.resetDirty('scene-resource');
      setEditingSceneResource(undefined);
      await refreshAfterSceneChange(selectedScene.id);
    } catch (error) {
      const message = String((error as Error).message ?? error);
      const title = '场景资料保存失败';
      setResourceSaveError({ title, message });
      Notification.error({ title, content: message });
    } finally {
      setSaving(false);
    }
  }

  async function handleResourceDelete(kind: SceneResourceKind, item: SceneResourceItem) {
    try {
      if (kind === 'plan') await deleteScenePlan(projectId, item.id);
      if (kind === 'version') await deleteSceneVersion(projectId, item.id);
      if (kind === 'summary') await deleteSceneSummary(projectId, item.id);
      if (kind === 'handoff') await deleteSceneHandoff(projectId, item.id);
      Notification.success({ title: `${resourceTitle[kind]}已删除` });
      await refreshAfterSceneChange(selectedScene?.id);
    } catch (error) {
      Notification.error({ title: '删除失败', content: String((error as Error).message ?? error) });
    }
  }

  async function handleResourceLifecycle(kind: 'summary' | 'handoff', item: SceneSummary | SceneHandoff, action: 'confirm' | 'archive' | 'restore') {
    try {
      if (kind === 'summary' && action === 'confirm') await confirmSceneSummary(projectId, item.id);
      if (kind === 'summary' && action === 'archive') await archiveSceneSummary(projectId, item.id);
      if (kind === 'summary' && action === 'restore') await restoreSceneSummary(projectId, item.id);
      if (kind === 'handoff' && action === 'confirm') await confirmSceneHandoff(projectId, item.id);
      if (kind === 'handoff' && action === 'archive') await archiveSceneHandoff(projectId, item.id);
      if (kind === 'handoff' && action === 'restore') await restoreSceneHandoff(projectId, item.id);
      Notification.success({ title: `${resourceTitle[kind]}已${actionLabel(action)}` });
      await refreshAfterSceneChange(selectedScene?.id);
    } catch (error) {
      Notification.error({ title: '状态操作失败', content: String((error as Error).message ?? error) });
    }
  }

  async function handleActivateSceneResource(kind: 'plan' | 'version', item: ScenePlan | SceneVersion) {
    if (!selectedScene) return;
    try {
      if (kind === 'plan') await activateScenePlan(projectId, selectedScene.id, item.id);
      if (kind === 'version') await activateSceneVersion(projectId, selectedScene.id, item.id);
      Notification.success({ title: `${resourceTitle[kind]}已设为当前` });
      await refreshAfterSceneChange(selectedScene.id);
    } catch (error) {
      Notification.error({ title: '设为当前失败', content: String((error as Error).message ?? error) });
    }
  }

  async function handleSaveVersion(activate: boolean) {
    if (!selectedChapter) return;
    if (!draftContent.trim()) {
      Notification.warning({ title: '正文不能为空' });
      return;
    }
    setSavingVersion(true);
    clearInlineError();
    try {
      const version = await createChapterVersion(projectId, selectedChapter.id, { content: draftContent, changeSummary: draftSummary.trim() || undefined, source: 'user' });
      if (activate) await activateChapterVersion(projectId, selectedChapter.id, version.id);
      Notification.success({ title: activate ? '章节正文版本已保存并设为当前' : '章节正文版本已保存' });
      await Promise.all([refreshChapters(), refreshProfile(selectedChapter.id)]);
    } catch (error) {
      keepInlineError('章节正文保存失败', error);
    } finally {
      setSavingVersion(false);
    }
  }

  async function handleActivateVersion(version: ChapterVersion) {
    if (!selectedChapter) return;
    try {
      await activateChapterVersion(projectId, selectedChapter.id, version.id);
      Notification.success({ title: '当前章节正文已更新' });
      await Promise.all([refreshChapters(), refreshProfile(selectedChapter.id)]);
    } catch (error) {
      Notification.error({ title: '版本激活失败', content: String((error as Error).message ?? error) });
    }
  }

  async function handlePreviewVersion(version: ChapterVersion) {
    setDraftContent(version.content);
    setDraftSummary(version.changeSummary ?? '');
    setActiveTab('body');
  }

  async function handleAssembleFromScenes() {
    if (!selectedChapter) return;
    const blockers = currentProgress?.hardBlockers ?? [];
    if (blockers.length > 0) {
      Notification.warning({ title: '仍有硬阻塞，暂不能装配', content: blockers.map((item) => item.message).join('；') });
      return;
    }
    setAssembling(true);
    clearInlineError();
    try {
      const input: AssembleChapterInput = { includeSceneTitles, activate: assembleActivate };
      const version = await assembleChapterFromScenes(projectId, selectedChapter.id, input);
      Notification.success({ title: assembleActivate ? '已从场景装配并设为当前章节正文' : '已从场景装配为新版本' });
      await Promise.all([refreshChapters(), refreshProfile(selectedChapter.id)]);
      setDraftContent(version.content);
      setActiveTab('body');
    } catch (error) {
      keepInlineError('从场景装配失败', error);
    } finally {
      setAssembling(false);
    }
  }

  async function saveSummary() {
    if (!selectedChapter || !editingSummary || !summaryFormApi) return;
    setSummarySaving(true);
    clearInlineError();
    try {
      const values = await summaryFormApi.validate() as Record<string, unknown>;
      const input = normalizeSummaryInput(values);
      await (editingSummary.mode === 'create' ? createChapterSummary(projectId, selectedChapter.id, input) : updateChapterSummary(projectId, editingSummary.summary.id, input));
      Notification.success({ title: '章节摘要已保存' });
      unsavedGuard.resetDirty('summary');
      setEditingSummary(undefined);
      await refreshProfile(selectedChapter.id);
      setActiveTab('summaries');
    } catch (error) {
      keepInlineError('章节摘要保存失败', error);
    } finally {
      setSummarySaving(false);
    }
  }

  async function handleSummaryAction(summary: ChapterSummary, action: 'confirm' | 'archive' | 'restore' | 'delete') {
    if (!selectedChapter) return;
    try {
      if (action === 'confirm') await confirmChapterSummary(projectId, summary.id);
      if (action === 'archive') await archiveChapterSummary(projectId, summary.id);
      if (action === 'restore') await restoreChapterSummary(projectId, summary.id);
      if (action === 'delete') await deleteChapterSummary(projectId, summary.id);
      Notification.success({ title: summaryActionLabel(action) });
      await refreshProfile(selectedChapter.id);
    } catch (error) {
      Notification.error({ title: '摘要操作失败', content: String((error as Error).message ?? error) });
    }
  }

  async function handleRollupSummaryFromScenes() {
    if (!selectedChapter) return;
    setRollingUpSummary(true);
    clearInlineError();
    try {
      await rollupChapterSummaryFromScenes(projectId, selectedChapter.id);
      Notification.success({ title: '已从已确认场景摘要汇总章节摘要' });
      await refreshProfile(selectedChapter.id);
      setActiveTab('summaries');
    } catch (error) {
      keepInlineError('摘要汇总失败', error);
    } finally {
      setRollingUpSummary(false);
    }
  }

  function focusIssue(issue: WritingIssue) {
    if (issue.target === 'summaries') {
      setActiveTab('summaries');
      return;
    }
    setActiveTab('flow');
    if (issue.sceneId) setSelectedSceneId(issue.sceneId);
    if (sceneTabs.includes(issue.target as SceneDetailTab)) setSceneTab(issue.target as SceneDetailTab);
  }

  const visibleScenes = filterScenes(chapterScenes, sceneProfiles, sceneFilter);

  function clearInlineError() {
    setInlineError(undefined);
  }

  function keepInlineError(title: string, error: unknown) {
    const message = String((error as Error).message ?? error);
    setInlineError({ title, message });
    Notification.error({ title, content: message });
  }

  function closeSheet(key: string, close: () => void) {
    unsavedGuard.guard(key, close);
  }

  async function refreshAfterDraftApply(draft: GeneratedDraft) {
    await refreshAiDrafts();
    if (!selectedChapter) return;
    await Promise.all([refreshChapters(), refreshProfile(selectedChapter.id), refreshSelectedChapterScenes(selectedChapter.id, selectedSceneId)]);
    if (selectedSceneId && (draft.targetType === 'scene_version' || draft.targetType === 'scene_plan')) await refreshSelectedSceneDetail(selectedSceneId);
  }

  async function handleApplyAiDraft(draft: GeneratedDraft, activate: boolean) {
    setDraftActionBusy(draft.id);
    try {
      await applyAiDraft(projectId, draft.id, { activate });
      Notification.success({ title: activate ? 'AI 草稿已应用并设为当前' : 'AI 草稿已应用' });
      await refreshAfterDraftApply(draft);
    } catch (error) {
      Notification.error({ title: 'AI 草稿应用失败', content: String((error as Error).message ?? error) });
    } finally {
      setDraftActionBusy(undefined);
    }
  }

  async function handleDiscardAiDraft(draft: GeneratedDraft) {
    setDraftActionBusy(draft.id);
    try {
      await discardAiDraft(projectId, draft.id);
      Notification.success({ title: 'AI 草稿已丢弃' });
      await refreshAiDrafts();
    } catch (error) {
      Notification.error({ title: 'AI 草稿丢弃失败', content: String((error as Error).message ?? error) });
    } finally {
      setDraftActionBusy(undefined);
    }
  }

  async function saveAiDraftEdit() {
    if (!editingAiDraft) return;
    setDraftActionBusy(editingAiDraft.draft.id);
    try {
      await updateAiDraft(projectId, editingAiDraft.draft.id, {
        payload: parseJsonObject(editingAiDraft.payloadText),
        textPreview: editingAiDraft.textPreview,
        feedback: editingAiDraft.feedback,
      });
      Notification.success({ title: 'AI 草稿已更新' });
      unsavedGuard.resetDirty('ai-draft');
      setEditingAiDraft(undefined);
      await refreshAiDrafts();
    } catch (error) {
      Notification.error({ title: 'AI 草稿编辑失败', content: String((error as Error).message ?? error) });
    } finally {
      setDraftActionBusy(undefined);
    }
  }

  async function handleRegenerateAiDraft(draft: GeneratedDraft) {
    const feedback = window.prompt('写下你希望新草稿怎么改。P1 会基于反馈创建一个新的 pending 草稿 mock，不会调用 AI。', draft.feedback ?? '');
    if (feedback === null) return;
    if (!feedback.trim()) {
      Notification.warning({ title: '请先填写反馈' });
      return;
    }
    setDraftActionBusy(draft.id);
    try {
      await regenerateAiDraft(projectId, draft.id, { feedback });
      Notification.success({ title: '已基于反馈创建新草稿（P1 mock，未调用 AI）' });
      await refreshAiDrafts();
    } catch (error) {
      Notification.error({ title: '反馈重生成失败', content: String((error as Error).message ?? error) });
    } finally {
      setDraftActionBusy(undefined);
    }
  }

  function handleSuggestionAction(item: NextSuggestion) {
    if (item.kind === 'createScene') {
      setEditingScene({ mode: 'create' });
      return;
    }
    if (item.kind === 'assembleChapter') {
      setActiveTab('body');
      return;
    }
    if (item.kind === 'rollupSummary') {
      setActiveTab('summaries');
      return;
    }
    if (item.kind === 'chapterComplete') return;
    if (item.sceneId) setSelectedSceneId(item.sceneId);
    setActiveTab('flow');
    setSceneTab(item.sceneTab);
  }

  return <div className="chapter-workspace">
    <section className="app-page-hero">
      <div>
        <Title heading={3} style={{ margin: 0 }}>章节写作</Title>
        <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>在第 N 章内完成场景计划、场景正文、摘要交接、章节装配和章节摘要闭环。</Text>
      </div>
      <Space className="app-page-actions">
        <Button icon={<IconRefresh />} onClick={() => selectedChapterId ? Promise.all([refreshChapters(), refreshProfile(selectedChapterId), refreshSelectedChapterScenes(selectedChapterId)]) : refreshChapters()}>刷新</Button>
        <Button theme="solid" type="primary" icon={<IconPlus />} onClick={() => setEditingChapter({ mode: 'create' })}>新增章节</Button>
      </Space>
    </section>

    {inlineError ? <div role="alert" style={{ marginBottom: 16, padding: 12, border: '1px solid var(--semi-color-danger)', borderRadius: 10, background: 'var(--semi-color-danger-light-default)' }}>
      <Text strong type="danger">{inlineError.title}</Text>
      <Paragraph style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{inlineError.message}</Paragraph>
    </div> : null}

    <div className="chapter-workspace__layout">
      <Card title="章节切换" className="chapter-workspace__chapters" bodyStyle={{ padding: 12 }}>
        {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={8} />} loading /> : chapters.length === 0 ? <EmptyState title="暂无章节" description="先创建章节。创建后可以直接在这里添加本章场景并开始写作。" action={<Button theme="solid" type="primary" icon={<IconPlus />} onClick={() => setEditingChapter({ mode: 'create' })}>新增章节</Button>} /> : <div className="chapter-switcher">
          {chapters.map((chapter) => {
            const selected = chapter.id === selectedChapterId;
            const progress = chapterProgress[chapter.id];
            return <button type="button" key={chapter.id} className="chapter-switcher__item" onClick={() => setSelectedChapterId(chapter.id)} style={{ textAlign: 'left', font: 'inherit', cursor: 'pointer', display: 'grid', gap: 8, padding: 12, border: `1px solid ${selected ? 'var(--semi-color-primary)' : 'var(--semi-color-border)'}`, borderRadius: 12, background: selected ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', color: 'var(--semi-color-text-0)' }}>
              <Space wrap spacing={6} style={{ rowGap: 6 }}>
                <Text strong>{chapter.title}</Text>
                <Tag size="small">#{chapter.orderIndex}</Tag>
                <StatusTag status={chapter.status} />
              </Space>
              <Text type={chapter.goal ? undefined : 'tertiary'} ellipsis={{ showTooltip: true }} style={{ display: 'block', whiteSpace: 'pre-wrap' }}>{chapter.goal || '未填写章节目标'}</Text>
              <Space wrap spacing={8}>
                <Tag size="small">场景 {progress?.currentVersionCount ?? 0}/{progress?.sceneCount ?? 0} 有正文</Tag>
                <Tag size="small">摘要 {progress?.confirmedSummaryCount ?? 0}/{progress?.sceneCount ?? 0}</Tag>
                <Tag size="small">交接 {progress?.confirmedHandoffCount ?? 0}/{progress?.sceneCount ?? 0}</Tag>
                {chapter.currentVersionId ? <Tag size="small" color="green">当前正文：有</Tag> : <Tag size="small">当前正文：无</Tag>}
              </Space>
            </button>;
          })}
        </div>}
      </Card>

      <Card className="chapter-workspace__main" bodyStyle={{ padding: 16 }}>
        {!selectedChapter ? <EmptyState title="未选择章节" description="从上方章节切换条选择章节，或新增章节。" action={<Button theme="solid" type="primary" icon={<IconPlus />} onClick={() => setEditingChapter({ mode: 'create' })}>新增章节</Button>} /> : profileLoading ? <Skeleton placeholder={<Skeleton.Paragraph rows={10} />} loading /> : <div>
          <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <Space wrap spacing={8} style={{ rowGap: 8 }}>
                <Title heading={4} style={{ margin: 0 }}>{selectedChapter.title}</Title>
                <Tag>#{selectedChapter.orderIndex}</Tag>
                <StatusTag status={selectedChapter.status} />
                {currentVersion ? <Tag color="green">当前章节正文 {shortId(currentVersion.id)}</Tag> : <Tag>暂无当前章节正文</Tag>}
                {profile?.currentSummary ? <Tag color="blue">有已确认章节摘要</Tag> : <Tag>暂无已确认章节摘要</Tag>}
              </Space>
              <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>写作中 · {currentProgress?.currentVersionCount ?? 0}/{currentProgress?.sceneCount ?? 0} 场景有正文 · {currentProgress?.confirmedSummaryCount ?? 0}/{currentProgress?.sceneCount ?? 0} 场景已确认摘要 · {currentProgress?.confirmedHandoffCount ?? 0}/{currentProgress?.sceneCount ?? 0} 场景有交接 · 当前正文{currentVersion ? '已存在' : '缺失'}</Text>
            </div>
            <Space>
              <Button icon={<IconEdit />} onClick={() => setEditingChapter({ mode: 'edit', chapter: selectedChapter })}>编辑元信息</Button>
              <Popconfirm title="确认删除这个章节？" content="章节会被软删除，并从当前列表移除。" onConfirm={() => handleDeleteChapter(selectedChapter)}><Button icon={<IconDelete />} type="danger" theme="borderless">删除</Button></Popconfirm>
            </Space>
          </section>

          <div role="tablist" aria-label="章节详情" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {detailTabs.map((tab) => <Button key={tab} id={`chapter-tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls={`chapter-panel-${tab}`} theme={activeTab === tab ? 'solid' : 'borderless'} type={activeTab === tab ? 'primary' : 'tertiary'} onClick={() => setActiveTab(tab)}>{tabLabel(tab)}</Button>)}
          </div>

          <div id={`chapter-panel-${activeTab}`} role="tabpanel" aria-labelledby={`chapter-tab-${activeTab}`}>
          {activeTab === 'flow' ? <WritingFlowPanel
            loading={progressLoading}
            scenes={visibleScenes}
            allScenes={chapterScenes}
            profiles={sceneProfiles}
            selectedScene={selectedScene}
            selectedSceneProfile={selectedSceneProfile}
            sceneTab={sceneTab}
            setSceneTab={setSceneTab}
            sceneFilter={sceneFilter}
            setSceneFilter={setSceneFilter}
            plans={scenePlans}
            versions={sceneVersions}
            summaries={sceneSummaries}
            handoffs={sceneHandoffs}
            onSelectScene={setSelectedSceneId}
            onCreateScene={() => setEditingScene({ mode: 'create' })}
            onEditScene={(scene) => setEditingScene({ mode: 'edit', scene })}
            onDeleteScene={handleDeleteScene}
            onCreateResource={(kind) => { setResourceSaveError(undefined); setEditingSceneResource({ kind, mode: 'create' }); }}
            onEditResource={(kind, item) => { setResourceSaveError(undefined); setEditingSceneResource({ kind, mode: 'edit', item }); }}
            onDeleteResource={handleResourceDelete}
            onActivateResource={handleActivateSceneResource}
            onLifecycle={handleResourceLifecycle}
          /> : null}
          {activeTab === 'body' ? <BodyPanel content={draftContent} setContent={setDraftContent} changeSummary={draftSummary} setChangeSummary={setDraftSummary} saveAndActivate={saveAndActivate} setSaveAndActivate={setSaveAndActivate} saving={savingVersion} onSave={() => handleSaveVersion(saveAndActivate)} currentVersion={currentVersion} includeSceneTitles={includeSceneTitles} setIncludeSceneTitles={setIncludeSceneTitles} assembleActivate={assembleActivate} setAssembleActivate={setAssembleActivate} assembling={assembling} onAssemble={handleAssembleFromScenes} hardBlockerCount={currentProgress?.hardBlockers.length ?? 0} /> : null}
          {activeTab === 'summaries' ? <SummariesPanel summaries={profile?.summaries ?? []} currentSummary={profile?.currentSummary} currentVersionId={profile?.chapter.currentVersionId ?? selectedChapter.currentVersionId} rollingUp={rollingUpSummary} onCreate={() => setEditingSummary({ mode: 'create' })} onEdit={(summary) => setEditingSummary({ mode: 'edit', summary })} onAction={handleSummaryAction} onRollup={handleRollupSummaryFromScenes} /> : null}
          {activeTab === 'versions' ? <VersionsPanel versions={profile?.versions ?? []} currentVersionId={profile?.chapter.currentVersionId ?? selectedChapter.currentVersionId} onPreview={handlePreviewVersion} onActivate={handleActivateVersion} /> : null}
          {activeTab === 'overview' ? <OverviewPanel chapter={selectedChapter} profile={profile} progress={currentProgress} onAssemble={handleAssembleFromScenes} includeSceneTitles={includeSceneTitles} setIncludeSceneTitles={setIncludeSceneTitles} assembleActivate={assembleActivate} setAssembleActivate={setAssembleActivate} assembling={assembling} /> : null}
          </div>
        </div>}
      </Card>

      <div className="chapter-workspace__context" style={{ display: 'grid', gap: 12 }}>
        <AiDraftPanel drafts={relevantAiDrafts} loading={aiDraftsLoading} busyDraftId={draftActionBusy} activate={applyDraftActivate} setActivate={setApplyDraftActivate} onApply={handleApplyAiDraft} onEdit={(draft) => setEditingAiDraft({ draft, payloadText: safeStringify(draft.payload), textPreview: draft.textPreview ?? '', feedback: draft.feedback ?? '' })} onDiscard={handleDiscardAiDraft} onRegenerate={handleRegenerateAiDraft} />
        <ContextPanel chapter={selectedChapter} profile={profile} progress={currentProgress} onIssueClick={focusIssue} onSuggestionClick={handleSuggestionAction} />
      </div>
    </div>

    <SideSheet title={editingChapter?.mode === 'create' ? '新增章节' : '编辑章节'} visible={Boolean(editingChapter)} onCancel={() => closeSheet('chapter', () => setEditingChapter(undefined))} width={560} footer={<SheetFooter onCancel={() => closeSheet('chapter', () => setEditingChapter(undefined))} onSave={saveChapter} saving={saving} />}>
      {editingChapter ? <Form key={editingChapter.mode === 'create' ? 'new-chapter' : editingChapter.chapter.id} initValues={editingChapter.mode === 'create' ? { status: 'draft', orderIndex: nextOrderIndex } : editingChapter.chapter} getFormApi={setFormApi} labelPosition="top" onValueChange={() => unsavedGuard.markDirty('chapter')}>
        <Form.Input field="title" label="章节标题" rules={[{ required: true, message: '请填写章节标题' }]} />
        <Form.Input field="plannedTitle" label="计划标题" />
        <Form.TextArea field="goal" label="章节目标" autosize={{ minRows: 3, maxRows: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <Form.InputNumber field="orderIndex" label="排序" style={{ width: '100%' }} />
          <Form.Select field="status" label="状态" style={{ width: '100%' }}>{chapterStatusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
        </div>
      </Form> : null}
    </SideSheet>

    <SideSheet title={editingScene?.mode === 'create' ? '新增本章场景' : '编辑场景基础信息'} visible={Boolean(editingScene)} onCancel={() => closeSheet('scene', () => setEditingScene(undefined))} width={620} footer={<SheetFooter onCancel={() => closeSheet('scene', () => setEditingScene(undefined))} onSave={saveScene} saving={saving} />}>
      {editingScene ? <Form key={editingScene.mode === 'create' ? `new-scene-${selectedChapterId}` : editingScene.scene.id} initValues={editingScene.mode === 'create' ? { status: 'planned', orderIndex: nextSceneOrderIndex } : editingScene.scene} getFormApi={setSceneFormApi} labelPosition="top" onValueChange={() => unsavedGuard.markDirty('scene')}>
        <Form.Input field="title" label="场景标题" />
        <Form.TextArea field="goal" label="场景目标" autosize={{ minRows: 3, maxRows: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <Form.InputNumber field="orderIndex" label="排序" style={{ width: '100%' }} />
          <Form.Select field="status" label="状态" style={{ width: '100%' }}>{sceneStatusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
        </div>
        <Form.Input field="storyTimeLabel" label="故事时间" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <Form.Select field="povCharacterId" label="POV 人物" showClear style={{ width: '100%' }}>{characterOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
          <Form.Select field="primaryLocationId" label="主要地点" showClear style={{ width: '100%' }}>{locationOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
        </div>
      </Form> : null}
    </SideSheet>

    <SideSheet title={editingSceneResource ? `${editingSceneResource.mode === 'create' ? '新增' : '编辑'}${resourceTitle[editingSceneResource.kind]}` : ''} visible={Boolean(editingSceneResource)} onCancel={() => closeSheet('scene-resource', () => setEditingSceneResource(undefined))} width={editingSceneResource?.kind === 'version' ? 'min(80vw, 900px)' : 'min(72vw, 820px)'} footer={<SheetFooter onCancel={() => closeSheet('scene-resource', () => setEditingSceneResource(undefined))} onSave={saveSceneResource} saving={saving} />}>
      {editingSceneResource ? <>
        {resourceSaveError ? <div role="alert" style={{ marginBottom: 12, padding: 12, border: '1px solid var(--semi-color-danger)', borderRadius: 10, background: 'var(--semi-color-danger-light-default)' }}>
          <Text strong type="danger">{resourceSaveError.title}</Text>
          <Paragraph style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{resourceSaveError.message}</Paragraph>
        </div> : null}
        <SceneResourceForm editing={editingSceneResource} formApiSetter={setResourceFormApi} currentVersionId={selectedSceneProfile?.scene.currentVersionId} sceneVersionOptions={sceneVersions.map((version) => ({ value: version.id, label: versionLabel(version) }))} sceneOptions={sceneOptions} onDirty={() => { setResourceSaveError(undefined); unsavedGuard.markDirty('scene-resource'); }} />
      </> : null}
    </SideSheet>

    <SideSheet title="编辑 AI 草稿/建议" visible={Boolean(editingAiDraft)} onCancel={() => closeSheet('ai-draft', () => setEditingAiDraft(undefined))} width="min(82vw, 920px)" footer={<SheetFooter onCancel={() => closeSheet('ai-draft', () => setEditingAiDraft(undefined))} onSave={saveAiDraftEdit} saving={Boolean(draftActionBusy && editingAiDraft?.draft.id === draftActionBusy)} />}>
      {editingAiDraft ? <div style={{ display: 'grid', gap: 14 }}>
        <Text type="tertiary">只能编辑 pending 草稿的 payload、展示预览和反馈；状态、归属和应用目标由系统控制。</Text>
        <div>
          <label htmlFor="ai-draft-preview" style={fieldLabelStyle}>预览文案</label>
          <textarea id="ai-draft-preview" value={editingAiDraft.textPreview} onChange={(event) => { setEditingAiDraft({ ...editingAiDraft, textPreview: event.target.value }); unsavedGuard.markDirty('ai-draft'); }} style={textareaStyle('18vh')} />
        </div>
        <div>
          <label htmlFor="ai-draft-payload" style={fieldLabelStyle}>Payload JSON</label>
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>应用时会按 targetType 解释。chapter_version/scene_version 需要 payload.content，chapter_summary 需要 payload.summary。</Text>
          <textarea id="ai-draft-payload" value={editingAiDraft.payloadText} onChange={(event) => { setEditingAiDraft({ ...editingAiDraft, payloadText: event.target.value }); unsavedGuard.markDirty('ai-draft'); }} style={textareaStyle('42vh')} />
        </div>
        <div>
          <label htmlFor="ai-draft-feedback" style={fieldLabelStyle}>反馈（用于后续重生成）</label>
          <textarea id="ai-draft-feedback" value={editingAiDraft.feedback} onChange={(event) => { setEditingAiDraft({ ...editingAiDraft, feedback: event.target.value }); unsavedGuard.markDirty('ai-draft'); }} style={textareaStyle('16vh')} />
        </div>
      </div> : null}
    </SideSheet>

    <SideSheet title={editingSummary?.mode === 'create' ? '新增章节摘要' : '编辑章节摘要'} visible={Boolean(editingSummary)} onCancel={() => closeSheet('summary', () => setEditingSummary(undefined))} width={680} footer={<SheetFooter onCancel={() => closeSheet('summary', () => setEditingSummary(undefined))} onSave={saveSummary} saving={summarySaving} />}>
      {editingSummary ? <Form key={editingSummary.mode === 'create' ? 'new-summary' : editingSummary.summary.id} initValues={summaryInitialValues(editingSummary, profile?.chapter.currentVersionId)} getFormApi={setSummaryFormApi} labelPosition="top" onValueChange={() => unsavedGuard.markDirty('summary')}>
        <Form.TextArea field="summary" label="章节摘要" rules={[{ required: true, message: '请填写章节摘要' }]} autosize={{ minRows: 5, maxRows: 12 }} />
        <Form.Input field="chapterVersionId" label="关联章节正文版本（可选）" />
        <Form.TextArea field="keyEventsText" label="关键事件（可选）" placeholder={'例如：主角离开故乡'} extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 3, maxRows: 8 }} />
        <Form.TextArea field="characterChangesText" label="人物变化（可选）" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 3, maxRows: 8 }} />
        <Form.TextArea field="newFactsText" label="新增事实（可选）" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 3, maxRows: 8 }} />
        <Text type="tertiary" size="small">章节摘要只供人工维护和场景摘要汇总，不会触发 AI 自动总结，也不会写入长期 MemoryRecord。</Text>
      </Form> : null}
    </SideSheet>
  </div>;
}

function WritingFlowPanel({ loading, scenes, allScenes, profiles, selectedScene, selectedSceneProfile, sceneTab, setSceneTab, sceneFilter, setSceneFilter, plans, versions, summaries, handoffs, onSelectScene, onCreateScene, onEditScene, onDeleteScene, onCreateResource, onEditResource, onDeleteResource, onActivateResource, onLifecycle }: {
  loading: boolean;
  scenes: Scene[];
  allScenes: Scene[];
  profiles: Record<string, SceneProfile | undefined>;
  selectedScene?: Scene;
  selectedSceneProfile?: SceneProfile;
  sceneTab: SceneDetailTab;
  setSceneTab: (tab: SceneDetailTab) => void;
  sceneFilter: 'all' | 'blocked' | 'no-body' | 'no-summary' | 'no-handoff';
  setSceneFilter: (filter: 'all' | 'blocked' | 'no-body' | 'no-summary' | 'no-handoff') => void;
  plans: ScenePlan[];
  versions: SceneVersion[];
  summaries: SceneSummary[];
  handoffs: SceneHandoff[];
  onSelectScene: (sceneId: string) => void;
  onCreateScene: () => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (scene: Scene) => void;
  onCreateResource: (kind: SceneResourceKind) => void;
  onEditResource: (kind: SceneResourceKind, item: SceneResourceItem) => void;
  onDeleteResource: (kind: SceneResourceKind, item: SceneResourceItem) => void;
  onActivateResource: (kind: 'plan' | 'version', item: ScenePlan | SceneVersion) => void;
  onLifecycle: (kind: 'summary' | 'handoff', item: SceneSummary | SceneHandoff, action: 'confirm' | 'archive' | 'restore') => void;
}) {
  return <div className="writing-flow-grid">
    <Card title="本章场景" className="scene-list-card" bodyStyle={{ padding: 12 }}>
      <Space wrap spacing={6} style={{ marginBottom: 12, rowGap: 6 }}>
        <Button size="small" theme={sceneFilter === 'all' ? 'solid' : 'light'} type="primary" onClick={() => setSceneFilter('all')}>全部</Button>
        <Button size="small" theme={sceneFilter === 'blocked' ? 'solid' : 'light'} type="primary" onClick={() => setSceneFilter('blocked')}>有阻塞</Button>
        <Button size="small" theme={sceneFilter === 'no-body' ? 'solid' : 'light'} type="primary" onClick={() => setSceneFilter('no-body')}>缺正文</Button>
        <Button size="small" theme={sceneFilter === 'no-summary' ? 'solid' : 'light'} type="primary" onClick={() => setSceneFilter('no-summary')}>缺摘要</Button>
        <Button size="small" theme={sceneFilter === 'no-handoff' ? 'solid' : 'light'} type="primary" onClick={() => setSceneFilter('no-handoff')}>缺交接</Button>
      </Space>
      <Button icon={<IconPlus />} theme="solid" type="primary" block onClick={onCreateScene} style={{ marginBottom: 12 }}>新增场景</Button>
      {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading /> : allScenes.length === 0 ? <EmptyState title="暂无场景" description="添加第一个场景后，就可以在章节页内写计划、正文、摘要和交接。" action={<Button theme="solid" type="primary" icon={<IconPlus />} onClick={onCreateScene}>新增场景</Button>} /> : scenes.length === 0 ? <EmptyState title="当前筛选无结果" description="切回全部场景继续查看。" action={<Button theme="light" type="primary" onClick={() => setSceneFilter('all')}>查看全部场景</Button>} /> : <div style={{ display: 'grid', gap: 8 }}>
        {scenes.map((scene) => <SceneCard key={scene.id} scene={scene} selected={scene.id === selectedScene?.id} profile={profiles[scene.id]} onClick={() => onSelectScene(scene.id)} />)}
      </div>}
    </Card>

    <Card title="当前场景详情" className="scene-detail-card" bodyStyle={{ padding: 16 }}>
      {!selectedScene ? <EmptyState title="未选择场景" description="从场景列表选择场景，或新增一条。" action={<Button theme="solid" type="primary" icon={<IconPlus />} onClick={onCreateScene}>新增场景</Button>} /> : <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            <Title heading={5} style={{ margin: 0 }}>{selectedScene.title || `场景 #${selectedScene.orderIndex}`}</Title>
            <Paragraph type={selectedScene.goal ? undefined : 'tertiary'} style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{selectedScene.goal || '未填写场景目标'}</Paragraph>
            <Space wrap spacing={6} style={{ marginTop: 8 }}>
              <Tag>#{selectedScene.orderIndex}</Tag>
              <StatusTag status={selectedScene.status} />
              {selectedScene.currentPlanId ? <Tag color="green">有当前计划</Tag> : <Tag>缺计划</Tag>}
              {selectedScene.currentVersionId ? <Tag color="green">有正文</Tag> : <Tag>缺正文</Tag>}
            </Space>
          </div>
          <Space>
            <Button icon={<IconEdit />} onClick={() => onEditScene(selectedScene)}>编辑基础信息</Button>
            <Popconfirm title="确认删除这个场景？" content="删除后会从本章场景列表移除。" onConfirm={() => onDeleteScene(selectedScene)}><Button icon={<IconDelete />} type="danger" theme="borderless">删除</Button></Popconfirm>
          </Space>
        </div>

        <div style={{ padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 12, marginBottom: 14 }}>
          <Space wrap spacing={8}>
            <InfoTag label="POV" value={entityLabel(selectedSceneProfile?.povCharacter, selectedScene.povCharacterId)} />
            <InfoTag label="地点" value={entityLabel(selectedSceneProfile?.primaryLocation, selectedScene.primaryLocationId)} />
            <InfoTag label="故事时间" value={selectedScene.storyTimeLabel} />
            <InfoTag label="当前计划" value={selectedSceneProfile?.currentPlan ? planLabel(selectedSceneProfile.currentPlan) : undefined} />
            <InfoTag label="当前正文" value={selectedSceneProfile?.currentVersion ? versionLabel(selectedSceneProfile.currentVersion) : undefined} />
          </Space>
        </div>

        <div role="tablist" aria-label="场景详情" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {sceneTabs.map((tab) => <Button key={tab} id={`scene-tab-${tab}`} role="tab" aria-selected={sceneTab === tab} aria-controls={`scene-panel-${tab}`} size="small" theme={sceneTab === tab ? 'solid' : 'borderless'} type={sceneTab === tab ? 'primary' : 'tertiary'} onClick={() => setSceneTab(tab)}>{sceneTabLabel(tab)}</Button>)}
        </div>

        <div id={`scene-panel-${sceneTab}`} role="tabpanel" aria-labelledby={`scene-tab-${sceneTab}`}>
        {sceneTab === 'plan' ? <ScenePlanPanel plans={plans} currentPlanId={selectedScene.currentPlanId} onCreate={() => onCreateResource('plan')} onEdit={(item) => onEditResource('plan', item)} onDelete={(item) => onDeleteResource('plan', item)} onActivate={(item) => onActivateResource('plan', item)} /> : null}
        {sceneTab === 'version' ? <SceneVersionPanel versions={versions} currentVersionId={selectedScene.currentVersionId} onCreate={() => onCreateResource('version')} onEdit={(item) => onEditResource('version', item)} onDelete={(item) => onDeleteResource('version', item)} onActivate={(item) => onActivateResource('version', item)} /> : null}
        {sceneTab === 'summary' ? <SceneSummaryPanel summaries={summaries} onCreate={() => onCreateResource('summary')} onEdit={(item) => onEditResource('summary', item)} onDelete={(item) => onDeleteResource('summary', item)} onLifecycle={(item, action) => onLifecycle('summary', item, action)} /> : null}
        {sceneTab === 'handoff' ? <SceneHandoffPanel handoffs={handoffs} onCreate={() => onCreateResource('handoff')} onEdit={(item) => onEditResource('handoff', item)} onDelete={(item) => onDeleteResource('handoff', item)} onLifecycle={(item, action) => onLifecycle('handoff', item, action)} /> : null}
        </div>
      </div>}
    </Card>
  </div>;
}

function SceneCard({ scene, profile, selected, onClick }: { scene: Scene; profile?: SceneProfile; selected: boolean; onClick: () => void }) {
  const summaryState = profile?.latestSummary ? '摘要已确认' : '摘要待确认';
  const handoffState = profile?.latestHandoff ? '有交接' : '缺交接';
  return <button type="button" onClick={onClick} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${selected ? 'var(--semi-color-primary)' : 'var(--semi-color-border)'}`, background: selected ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', cursor: 'pointer' }}>
    <Text strong ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>#{scene.orderIndex} {scene.title || '未命名场景'}</Text>
    <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ display: 'block', marginTop: 4 }}>目标：{scene.goal || '未填写'}</Text>
    <Space spacing={4} wrap style={{ marginTop: 8 }}>
      {scene.currentPlanId ? <Tag size="small" color="green">有计划</Tag> : <Tag size="small">缺计划</Tag>}
      {scene.currentVersionId && profile?.currentVersion ? <Tag size="small" color="green">有正文</Tag> : <Tag size="small">缺正文</Tag>}
      <Tag size="small" color={profile?.latestSummary ? 'green' : 'orange'}>{summaryState}</Tag>
      <Tag size="small" color={profile?.latestHandoff ? 'green' : 'orange'}>{handoffState}</Tag>
    </Space>
  </button>;
}

function ScenePlanPanel({ plans, currentPlanId, onCreate, onEdit, onDelete, onActivate }: { plans: ScenePlan[]; currentPlanId?: string | null; onCreate: () => void; onEdit: (item: ScenePlan) => void; onDelete: (item: ScenePlan) => void; onActivate: (item: ScenePlan) => void }) {
  return <ResourcePanel title="计划" empty="还没有场景计划。先写清楚这场要完成什么，再进入正文会更稳。" onCreate={onCreate} createLabel="新增计划">
    {plans.map((plan) => <ResourceItem key={plan.id} title={planLabel(plan)} summary={plan.outline || plan.conflict || plan.goal} tags={[currentPlanId === plan.id ? '当前' : '', plan.canonStatus ?? ''].filter(Boolean)} onEdit={() => onEdit(plan)} onDelete={() => onDelete(plan)} extra={<Button size="small" disabled={currentPlanId === plan.id} onClick={() => onActivate(plan)}>设为当前</Button>} />)}
  </ResourcePanel>;
}

function SceneVersionPanel({ versions, currentVersionId, onCreate, onEdit, onDelete, onActivate }: { versions: SceneVersion[]; currentVersionId?: string | null; onCreate: () => void; onEdit: (item: SceneVersion) => void; onDelete: (item: SceneVersion) => void; onActivate: (item: SceneVersion) => void }) {
  return <ResourcePanel title="正文" empty="这个场景还没有正文。写完后，它会参与章节正文装配。" onCreate={onCreate} createLabel="写场景正文">
    {versions.map((version) => <ResourceItem key={version.id} title={versionLabel(version)} summary={version.changeSummary || version.content} tags={[currentVersionId === version.id ? '当前正文' : '', `${version.wordCount ?? countWords(version.content)} 字`].filter(Boolean)} onEdit={() => onEdit(version)} onDelete={() => onDelete(version)} extra={<Button size="small" disabled={currentVersionId === version.id} onClick={() => onActivate(version)}>设为当前正文</Button>} />)}
  </ResourcePanel>;
}

function SceneSummaryPanel({ summaries, onCreate, onEdit, onDelete, onLifecycle }: { summaries: SceneSummary[]; onCreate: () => void; onEdit: (item: SceneSummary) => void; onDelete: (item: SceneSummary) => void; onLifecycle: (item: SceneSummary, action: 'confirm' | 'archive' | 'restore') => void }) {
  return <ResourcePanel title="摘要" empty="还没有场景摘要。确认摘要后，本章才能稳定汇总章节摘要。" onCreate={onCreate} createLabel="新增摘要">
    {summaries.map((summary) => <ResourceItem key={summary.id} title={shortText(summary.summary, 32) || '摘要'} summary={summary.summary} tags={[summary.canonStatus ?? 'draft', summary.canonStatus === 'confirmed' ? '可靠上下文' : '未确认，不会作为可靠上下文'].filter(Boolean)} onEdit={() => onEdit(summary)} onDelete={() => onDelete(summary)} extra={<LifecycleButtons status={summary.canonStatus} onAction={(action) => onLifecycle(summary, action)} />} />)}
  </ResourcePanel>;
}

function SceneHandoffPanel({ handoffs, onCreate, onEdit, onDelete, onLifecycle }: { handoffs: SceneHandoff[]; onCreate: () => void; onEdit: (item: SceneHandoff) => void; onDelete: (item: SceneHandoff) => void; onLifecycle: (item: SceneHandoff, action: 'confirm' | 'archive' | 'restore') => void }) {
  return <ResourcePanel title="交接" empty="还没有场景交接。交接用于提醒下一场必须接住的变化、悬念和风险。" onCreate={onCreate} createLabel="新增交接">
    {handoffs.map((handoff) => <ResourceItem key={handoff.id} title={shortText(displayValue(handoff.nextSceneMust) || displayValue(handoff.readerKnows), 32) || '交接'} summary={displayValue(handoff.readerKnows) || displayValue(handoff.openQuestions) || displayValue(handoff.nextSceneMust)} tags={[handoff.canonStatus ?? 'draft', handoff.canonStatus === 'confirmed' ? '可靠交接' : '未确认，不会作为可靠上下文'].filter(Boolean)} onEdit={() => onEdit(handoff)} onDelete={() => onDelete(handoff)} extra={<LifecycleButtons status={handoff.canonStatus} onAction={(action) => onLifecycle(handoff, action)} />} />)}
  </ResourcePanel>;
}

function ResourcePanel({ title, empty, onCreate, createLabel, children }: { title: string; empty: string; onCreate: () => void; createLabel: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <section>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <Text strong>{title}</Text>
      <Button size="small" theme="solid" type="primary" icon={<IconPlus />} onClick={onCreate}>{createLabel}</Button>
    </div>
    {!hasChildren ? <Text type="tertiary">{empty}</Text> : <div style={{ display: 'grid', gap: 10 }}>{children}</div>}
  </section>;
}

function ResourceItem({ title, summary, tags, extra, onEdit, onDelete }: { title: string; summary?: string | null; tags: string[]; extra?: React.ReactNode; onEdit: () => void; onDelete: () => void }) {
  return <article style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 10 }}>
    <div style={{ minWidth: 0 }}>
      <Space wrap spacing={6}>{tags.map((tag) => <Tag key={tag} size="small" color={tag.includes('当前') || tag.includes('confirmed') || tag.includes('可靠') ? 'green' : undefined}>{tag}</Tag>)}</Space>
      <Text strong style={{ display: 'block', marginTop: 8 }}>{title}</Text>
      {summary ? <Paragraph ellipsis={{ rows: 3, showTooltip: true }} style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{summary}</Paragraph> : null}
    </div>
    <Space wrap>
      {extra}
      <Button size="small" onClick={onEdit}>编辑</Button>
      <Popconfirm title="确认删除？" content="删除为软删除，列表中将不再显示。" onConfirm={onDelete}><Button size="small" type="danger" theme="borderless">删除</Button></Popconfirm>
    </Space>
  </article>;
}

function LifecycleButtons({ status, onAction }: { status?: string | null; onAction: (action: 'confirm' | 'archive' | 'restore') => void }) {
  return <Space wrap>
    <Button size="small" disabled={status === 'confirmed'} onClick={() => onAction('confirm')}>确认</Button>
    {status === 'archived' ? <Button size="small" onClick={() => onAction('restore')}>恢复</Button> : <Button size="small" onClick={() => onAction('archive')}>归档</Button>}
  </Space>;
}

function BodyPanel({ content, setContent, changeSummary, setChangeSummary, saveAndActivate, setSaveAndActivate, saving, onSave, currentVersion, includeSceneTitles, setIncludeSceneTitles, assembleActivate, setAssembleActivate, assembling, onAssemble, hardBlockerCount }: {
  content: string;
  setContent: (value: string) => void;
  changeSummary: string;
  setChangeSummary: (value: string) => void;
  saveAndActivate: boolean;
  setSaveAndActivate: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
  currentVersion?: ChapterVersion | null;
  includeSceneTitles: boolean;
  setIncludeSceneTitles: (value: boolean) => void;
  assembleActivate: boolean;
  setAssembleActivate: (value: boolean) => void;
  assembling: boolean;
  onAssemble: () => void;
  hardBlockerCount: number;
}) {
  return <div style={{ display: 'grid', gap: 14 }}>
    <Card title="从场景装配章节正文" bodyStyle={{ padding: 16 }}>
      <Text type="tertiary" style={{ display: 'block', marginBottom: 12 }}>按场景顺序读取每个场景的当前正文，拼接为新的章节正文版本。软提醒不阻止装配，硬阻塞会禁用装配。</Text>
      <Space wrap spacing={16} style={{ marginBottom: 12 }}>
        <Checkbox checked={includeSceneTitles} onChange={(event) => setIncludeSceneTitles(Boolean(event.target.checked))}>包含场景标题</Checkbox>
        <Checkbox checked={assembleActivate} onChange={(event) => setAssembleActivate(Boolean(event.target.checked))}>装配后设为当前章节正文</Checkbox>
      </Space>
      <Button theme="solid" type="primary" loading={assembling} disabled={hardBlockerCount > 0} aria-describedby={hardBlockerCount > 0 ? 'chapter-assemble-disabled-reason' : undefined} onClick={onAssemble}>装配章节正文</Button>
      {hardBlockerCount > 0 ? <Text id="chapter-assemble-disabled-reason" type="warning" style={{ marginLeft: 12 }}>还有 {hardBlockerCount} 个硬阻塞未处理，处理后才能装配。</Text> : null}
    </Card>
    <div style={{ display: 'grid', gap: 12 }}>
      <Space wrap spacing={8}>
        <Tag color="blue">字数 {countWords(content)}</Tag>
        {currentVersion ? <Text type="tertiary">当前章节正文：{shortId(currentVersion.id)} · {formatDate(currentVersion.updatedAt || currentVersion.createdAt)}</Text> : <Text type="tertiary">暂无当前章节正文，可直接编辑并保存为版本。</Text>}
      </Space>
      <Text type="tertiary">这里是写作优先的大编辑区。保存会生成新的章节正文版本，不会覆盖历史版本。</Text>
      <div>
        <label htmlFor="chapter-body-content" style={fieldLabelStyle}>章节正文</label>
        <Text id="chapter-body-content-help" type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>这里是读者最终看到的章节正文。保存会生成新的章节版本，不会覆盖历史版本。</Text>
        <textarea id="chapter-body-content" value={content} onChange={(event) => setContent(event.target.value)} aria-describedby="chapter-body-content-help" style={textareaStyle('50vh')} />
      </div>
      <div>
        <label htmlFor="chapter-version-summary" style={fieldLabelStyle}>版本说明（可选）</label>
        <Text id="chapter-version-summary-help" type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>简要说明这次保存的改动，便于之后区分版本。</Text>
        <input id="chapter-version-summary" value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} aria-describedby="chapter-version-summary-help" style={inputStyle} />
      </div>
      <Space style={{ justifyContent: 'space-between' }}>
        <Checkbox checked={saveAndActivate} onChange={(event) => setSaveAndActivate(Boolean(event.target.checked))}>保存后设为当前章节正文</Checkbox>
        <Button theme="solid" type="primary" loading={saving} onClick={onSave}>保存为新章节版本</Button>
      </Space>
    </div>
  </div>;
}

function OverviewPanel({ chapter, profile, progress, onAssemble, includeSceneTitles, setIncludeSceneTitles, assembleActivate, setAssembleActivate, assembling }: {
  chapter: Chapter;
  profile?: ChapterProfile;
  progress?: SceneProgress;
  onAssemble: () => void;
  includeSceneTitles: boolean;
  setIncludeSceneTitles: (value: boolean) => void;
  assembleActivate: boolean;
  setAssembleActivate: (value: boolean) => void;
  assembling: boolean;
}) {
  return <div style={{ display: 'grid', gap: 16 }}>
    <Card title="章节概览" bodyStyle={{ padding: 16 }}>
      <Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{chapter.goal || '未填写章节目标。'}</Paragraph>
      <Space wrap spacing={8}>
        <Text type="tertiary">创建：{formatDate(chapter.createdAt)}</Text>
        <Text type="tertiary">更新：{formatDate(chapter.updatedAt)}</Text>
        <Text type="tertiary">版本：{profile?.stats.versionCount ?? 0}</Text>
        <Text type="tertiary">场景：{progress?.sceneCount ?? 0}</Text>
      </Space>
    </Card>
    <Card title="从场景装配正文" bodyStyle={{ padding: 16 }}>
      <Text type="tertiary" style={{ display: 'block', marginBottom: 12 }}>按当前章节下未删除场景的 orderIndex 排序，读取每个当前场景正文并拼接为新的 ChapterVersion。</Text>
      <Space wrap spacing={16} style={{ marginBottom: 12 }}>
        <Checkbox checked={includeSceneTitles} onChange={(event) => setIncludeSceneTitles(Boolean(event.target.checked))}>包含场景标题</Checkbox>
        <Checkbox checked={assembleActivate} onChange={(event) => setAssembleActivate(Boolean(event.target.checked))}>装配后设为当前章节正文</Checkbox>
      </Space>
      <Space wrap>
        <Button theme="solid" type="primary" loading={assembling} disabled={(progress?.hardBlockers.length ?? 0) > 0} aria-describedby={(progress?.hardBlockers.length ?? 0) > 0 ? 'chapter-overview-assemble-disabled-reason' : undefined} onClick={onAssemble}>从场景装配</Button>
        <Text id={(progress?.hardBlockers.length ?? 0) > 0 ? 'chapter-overview-assemble-disabled-reason' : undefined} type={(progress?.hardBlockers.length ?? 0) > 0 ? 'warning' : 'tertiary'}>场景数：{progress?.sceneCount ?? 0}；{(progress?.hardBlockers.length ?? 0) > 0 ? '存在硬阻塞，处理后才能装配' : '可装配'}</Text>
      </Space>
    </Card>
  </div>;
}

function VersionsPanel({ versions, currentVersionId, onPreview, onActivate }: { versions: ChapterVersion[]; currentVersionId?: string | null; onPreview: (version: ChapterVersion) => void; onActivate: (version: ChapterVersion) => void }) {
  if (versions.length === 0) return <EmptyState title="暂无版本" description="在“章节正文”中保存，或从场景装配生成 ChapterVersion。" />;
  return <div style={{ display: 'grid', gap: 10 }}>
    {versions.map((version) => <article key={version.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 12 }}>
      <div style={{ minWidth: 0 }}>
        <Space wrap spacing={8}>
          <Tag color={version.id === currentVersionId ? 'green' : undefined}>{version.id === currentVersionId ? '当前章节正文' : shortId(version.id)}</Tag>
          <Tag size="small">{version.source}</Tag>
          <Text type="tertiary" size="small">{formatDate(version.createdAt)}</Text>
          <Text type="tertiary" size="small">字数 {countWords(version.content)}</Text>
        </Space>
        <Paragraph ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{version.content}</Paragraph>
        {version.changeSummary ? <Text type="tertiary" size="small">说明：{version.changeSummary}</Text> : null}
      </div>
      <Space>
        <Button onClick={() => onPreview(version)}>预览/编辑</Button>
        <Button disabled={version.id === currentVersionId} theme="solid" type="primary" onClick={() => onActivate(version)}>设为当前</Button>
      </Space>
    </article>)}
  </div>;
}

function SummariesPanel({ summaries, currentSummary, currentVersionId, rollingUp, onCreate, onEdit, onAction, onRollup }: {
  summaries: ChapterSummary[];
  currentSummary?: ChapterSummary | null;
  currentVersionId?: string | null;
  rollingUp: boolean;
  onCreate: () => void;
  onEdit: (summary: ChapterSummary) => void;
  onAction: (summary: ChapterSummary, action: 'confirm' | 'archive' | 'restore' | 'delete') => void;
  onRollup: () => void;
}) {
  return <div style={{ display: 'grid', gap: 12 }}>
    <Card bodyStyle={{ padding: 16 }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <div>
          <Text strong>章节摘要</Text>
          <Text type="tertiary" style={{ display: 'block', marginTop: 4 }}>记录本章已经发生的关键变化；从场景摘要汇总只读取已确认 SceneSummary，不调用 AI。</Text>
        </div>
        <Space>
          <Button onClick={onRollup} loading={rollingUp}>从场景摘要汇总</Button>
          <Button theme="solid" type="primary" icon={<IconPlus />} onClick={onCreate}>新增章节摘要</Button>
        </Space>
      </Space>
    </Card>
    {currentSummary ? <Card title="当前已确认章节摘要" bodyStyle={{ padding: 16 }}><Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{currentSummary.summary}</Paragraph></Card> : null}
    {summaries.length === 0 ? <EmptyState title="暂无章节摘要" description="可手动新增，或先确认场景摘要后从场景摘要汇总。" /> : <div style={{ display: 'grid', gap: 10 }}>
      {summaries.map((summary) => <article key={summary.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Space wrap spacing={8}>
            <Tag color={summary.canonStatus === 'confirmed' ? 'green' : summary.canonStatus === 'archived' ? 'grey' : undefined}>{summary.canonStatus}</Tag>
            {summary.id === currentSummary?.id ? <Tag color="blue">当前摘要</Tag> : null}
            {summary.chapterVersionId === currentVersionId && currentVersionId ? <Tag size="small" color="green">当前正文版本</Tag> : summary.chapterVersionId ? <Tag size="small">版本 {shortId(summary.chapterVersionId)}</Tag> : null}
            <Text type="tertiary" size="small">{formatDate(summary.createdAt)}</Text>
          </Space>
          <Paragraph ellipsis={{ rows: 4, showTooltip: true }} style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{summary.summary}</Paragraph>
        </div>
        <Space wrap>
          <Button onClick={() => onEdit(summary)}>编辑</Button>
          <Button disabled={summary.canonStatus === 'confirmed'} onClick={() => onAction(summary, 'confirm')}>确认</Button>
          {summary.canonStatus === 'archived' ? <Button onClick={() => onAction(summary, 'restore')}>恢复</Button> : <Button onClick={() => onAction(summary, 'archive')}>归档</Button>}
          <Popconfirm title="确认删除这条章节摘要？" content="删除为软删除；列表中将不再显示。" onConfirm={() => onAction(summary, 'delete')}><Button type="danger" theme="borderless">删除</Button></Popconfirm>
        </Space>
      </article>)}
    </div>}
  </div>;
}


function AiDraftPanel({ drafts, loading, busyDraftId, activate, setActivate, onApply, onEdit, onDiscard, onRegenerate }: {
  drafts: GeneratedDraft[];
  loading: boolean;
  busyDraftId?: string;
  activate: boolean;
  setActivate: (value: boolean) => void;
  onApply: (draft: GeneratedDraft, activate: boolean) => void;
  onEdit: (draft: GeneratedDraft) => void;
  onDiscard: (draft: GeneratedDraft) => void;
  onRegenerate: (draft: GeneratedDraft) => void;
}) {
  return <Card title="AI 草稿/建议" bodyStyle={{ padding: 12 }}>
    <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 10 }}>只显示当前章节和当前场景相关的 pending 草稿。P1 反馈重生成会创建新草稿 mock，不调用 AI。</Text>
    <Checkbox checked={activate} onChange={(event) => setActivate(Boolean(event.target.checked))} style={{ marginBottom: 10 }}>应用版本类草稿后设为当前</Checkbox>
    {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={4} />} loading /> : drafts.length === 0 ? <EmptyState title="暂无相关 AI 草稿" description="后续生成任务会把候选正文、场景计划和摘要放到这里等待审核。" /> : <div style={{ display: 'grid', gap: 10 }}>
      {drafts.map((draft) => {
        const canActivate = draft.targetType === 'chapter_version' || draft.targetType === 'scene_version' || draft.targetType === 'scene_plan';
        const busy = busyDraftId === draft.id;
        return <article key={draft.id} style={{ padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 12 }}>
          <Space wrap spacing={6} style={{ rowGap: 6 }}>
            <Tag color="blue">{draftTargetLabel(draft.targetType)}</Tag>
            <Tag>{draft.draftType}</Tag>
            <Tag color="green">{draft.status}</Tag>
            <Text type="tertiary" size="small">{formatDate(draft.updatedAt)}</Text>
          </Space>
          <Paragraph ellipsis={{ rows: 4, showTooltip: true }} style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{draft.textPreview || draftPayloadPreview(draft.payload)}</Paragraph>
          {draft.feedback ? <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }}>反馈：{draft.feedback}</Text> : null}
          <Space wrap style={{ marginTop: 10 }}>
            <Button size="small" theme="solid" type="primary" loading={busy} onClick={() => onApply(draft, canActivate ? activate : false)}>应用</Button>
            <Button size="small" onClick={() => onEdit(draft)}>编辑</Button>
            <Button size="small" onClick={() => onRegenerate(draft)}>带反馈重生成</Button>
            <Popconfirm title="确认丢弃这个 AI 草稿？" content="丢弃不会物理删除，只会退出 pending 列表。" onConfirm={() => onDiscard(draft)}><Button size="small" type="danger" theme="borderless" loading={busy}>丢弃</Button></Popconfirm>
          </Space>
        </article>;
      })}
    </div>}
  </Card>;
}

function ContextPanel({ chapter, profile, progress, onIssueClick, onSuggestionClick }: { chapter?: Chapter; profile?: ChapterProfile; progress?: SceneProgress; onIssueClick: (issue: WritingIssue) => void; onSuggestionClick: (item: NextSuggestion) => void }) {
  const next = nextSuggestions(chapter, profile, progress);
  return <Card title="上下文 / 下一步" className="chapter-workspace__context" bodyStyle={{ padding: 12 }}>
    {!chapter ? <EmptyState title="未选择章节" description="选择章节后查看目标、阻塞和下一步。" /> : <div style={{ display: 'grid', gap: 14 }}>
      <section>
        <Text strong>本章目标</Text>
        <Paragraph type={chapter.goal ? undefined : 'tertiary'} style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{chapter.goal || '未填写章节目标。'}</Paragraph>
      </section>
      <section>
        <Text strong>装配硬阻塞</Text>
        <IssueList empty="暂无硬阻塞，可以装配章节正文。" issues={progress?.hardBlockers ?? []} onClick={onIssueClick} color="red" />
      </section>
      <section>
        <Text strong>软提醒</Text>
        <IssueList empty="暂无软提醒。" issues={progress?.softWarnings ?? []} onClick={onIssueClick} color="orange" />
      </section>
      <section>
        <Text strong>下一步建议</Text>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {next.map((item) => <Button key={item.label} onClick={() => onSuggestionClick(item)}>{item.label}</Button>)}
        </div>
      </section>
    </div>}
  </Card>;
}

function IssueList({ issues, empty, onClick, color }: { issues: WritingIssue[]; empty: string; onClick: (issue: WritingIssue) => void; color: 'red' | 'orange' }) {
  if (issues.length === 0) return <Text type="tertiary" style={{ display: 'block', marginTop: 8 }}>{empty}</Text>;
  return <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
    {issues.map((issue) => <button key={issue.key} type="button" onClick={() => onClick(issue)} style={{ textAlign: 'left', border: '1px solid var(--semi-color-border)', borderRadius: 8, padding: 10, background: 'var(--semi-color-bg-0)', cursor: 'pointer' }}><Tag size="small" color={color}>{color === 'red' ? '阻塞' : '提醒'}</Tag><Text style={{ marginLeft: 8 }}>{issue.message}</Text></button>)}
  </div>;
}

function SceneResourceForm({ editing, formApiSetter, currentVersionId, sceneVersionOptions, sceneOptions, onDirty }: { editing: EditingSceneResourceState; formApiSetter: (api: FormApi) => void; currentVersionId?: string | null; sceneVersionOptions: SelectOption[]; sceneOptions: SelectOption[]; onDirty: () => void }) {
  const values = resourceInitialValues(editing, currentVersionId);
  return <Form key={`${editing.kind}:${editing.mode}:${editing.mode === 'edit' ? editing.item.id : 'new'}`} initValues={values} getFormApi={formApiSetter} labelPosition="top" onValueChange={onDirty}>
    {editing.kind === 'plan' ? <>
      <Form.Input field="title" label="标题" />
      <Form.TextArea field="goal" label="目标" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="outline" label="梗概" autosize={{ minRows: 5, maxRows: 12 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="conflict" label="冲突" autosize={{ minRows: 5, maxRows: 12 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="choice" label="选择" autosize={{ minRows: 5, maxRows: 12 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="consequence" label="后果" autosize={{ minRows: 5, maxRows: 12 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="readerPromise" label="读者期待" autosize={{ minRows: 3, maxRows: 8 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="readerPayoff" label="读者回报" autosize={{ minRows: 3, maxRows: 8 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="nextHook" label="下一场钩子" autosize={{ minRows: 3, maxRows: 8 }} textareaStyle={longTextareaStyle} />
    </> : null}
    {editing.kind === 'version' ? <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', columnGap: 16 }}>
        <Form.Select field="source" label="来源" style={{ width: '100%' }}>{sceneSourceOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
        <Form.InputNumber field="wordCount" label="字数" style={{ width: '100%' }} />
        <Form.Select field="basedOnVersionId" label="基于正文版本" showClear style={{ width: '100%' }}>{sceneVersionOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
      </div>
      <Form.TextArea field="changeSummary" label="变更说明" autosize={{ minRows: 3, maxRows: 8 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="content" label="正文" extraText="写作优先的大编辑区。保存会生成新的场景正文版本，新增版本会自动设为当前正文。" rules={[{ required: true, message: '请填写正文' }]} autosize={false} rows={24} style={{ width: '100%' }} textareaStyle={writingTextareaStyle} resize="vertical" />
    </> : null}
    {editing.kind === 'summary' ? <>
      <Form.Select field="sceneVersionId" label="关联正文版本" showClear style={{ width: '100%' }}>{sceneVersionOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
      <Form.TextArea field="summary" label="摘要" rules={[{ required: true, message: '请填写摘要' }]} autosize={{ minRows: 6, maxRows: 14 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="keyEventsText" label="关键事件" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="characterChangesText" label="人物变化" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="newFactsText" label="新增事实" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Text type="tertiary" size="small">这条摘要确认前，不会作为可靠上下文使用。</Text>
    </> : null}
    {editing.kind === 'handoff' ? <>
      <Form.Select field="sceneVersionId" label="关联正文版本" showClear style={{ width: '100%' }}>{sceneVersionOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
      <Form.Select field="nextSceneId" label="指向下一场" showClear style={{ width: '100%' }}>{sceneOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
      <Form.TextArea field="readerKnowsText" label="读者已知信息" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="actualChangesText" label="实际变化" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="openQuestionsText" label="未解问题" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="nextSceneMustText" label="下一场必须处理" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Form.TextArea field="riskNotesText" label="风险备注" extraText="可以每行写一条，也可以粘贴 JSON。" autosize={{ minRows: 4, maxRows: 10 }} textareaStyle={longTextareaStyle} />
      <Text type="tertiary" size="small">这条交接确认前，不会作为可靠上下文使用。</Text>
    </> : null}
  </Form>;
}

function SheetFooter({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={onCancel}>取消</Button><Button theme="solid" type="primary" loading={saving} onClick={onSave}>保存</Button></div>;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
    <Empty title={title} description={description} image={<IllustrationNoContent style={{ width: 120, height: 120 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 120, height: 120 }} />} />
    {action}
  </div>;
}

function InfoTag({ label, value }: { label: string; value: unknown }) {
  return <Tag>{label}：{displayValue(value) || '未填写'}</Tag>;
}

async function loadSceneProfiles(projectId: string, scenes: Scene[]) {
  const entries = await Promise.all(scenes.map(async (scene) => [scene.id, await getSceneProfile(projectId, scene.id).catch(() => undefined)] as const));
  return Object.fromEntries(entries) as Record<string, SceneProfile | undefined>;
}

function buildSceneProgress(scenes: Scene[], profiles: Record<string, SceneProfile | undefined>, hasChapterSummary: boolean): SceneProgress {
  const hardBlockers: WritingIssue[] = [];
  const softWarnings: WritingIssue[] = [];
  if (scenes.length === 0) hardBlockers.push({ key: 'no-scenes', message: '本章还没有场景', target: 'flow' });
  scenes.forEach((scene) => {
    const profile = profiles[scene.id];
    if (!scene.currentVersionId) hardBlockers.push({ key: `${scene.id}:missing-version`, sceneId: scene.id, target: 'version', message: `#${scene.orderIndex} ${scene.title || '未命名场景'}：缺少当前正文` });
    else if (!profile?.currentVersion) hardBlockers.push({ key: `${scene.id}:invalid-version`, sceneId: scene.id, target: 'version', message: `#${scene.orderIndex} ${scene.title || '未命名场景'}：当前正文版本不可用` });
    if (!profile?.latestSummary) softWarnings.push({ key: `${scene.id}:summary`, sceneId: scene.id, target: 'summary', message: `#${scene.orderIndex} ${scene.title || '未命名场景'}：摘要未 confirmed` });
    if (!profile?.latestHandoff) softWarnings.push({ key: `${scene.id}:handoff`, sceneId: scene.id, target: 'handoff', message: `#${scene.orderIndex} ${scene.title || '未命名场景'}：缺少交接` });
  });
  if (!hasChapterSummary) softWarnings.push({ key: 'chapter-summary', target: 'summaries', message: '本章还没有已确认章节摘要' });
  return {
    scenes,
    profiles,
    sceneCount: scenes.length,
    currentVersionCount: scenes.filter((scene) => scene.currentVersionId && profiles[scene.id]?.currentVersion).length,
    confirmedSummaryCount: scenes.filter((scene) => profiles[scene.id]?.latestSummary).length,
    confirmedHandoffCount: scenes.filter((scene) => profiles[scene.id]?.latestHandoff).length,
    hardBlockers,
    softWarnings,
  };
}

function filterScenes(scenes: Scene[], profiles: Record<string, SceneProfile | undefined>, filter: 'all' | 'blocked' | 'no-body' | 'no-summary' | 'no-handoff') {
  if (filter === 'all') return scenes;
  return scenes.filter((scene) => {
    const profile = profiles[scene.id];
    if (filter === 'blocked' || filter === 'no-body') return !scene.currentVersionId || !profile?.currentVersion;
    if (filter === 'no-summary') return !profile?.latestSummary;
    if (filter === 'no-handoff') return !profile?.latestHandoff;
    return true;
  });
}

function saveResource(projectId: string, sceneId: string, editing: EditingSceneResourceState, values: Record<string, unknown>, currentVersionId?: string | null) {
  if (editing.kind === 'plan') {
    const input: ScenePlanInput = normalizeNullableFields(values, ['title', 'goal', 'outline', 'conflict', 'choice', 'consequence', 'readerPromise', 'readerPayoff', 'nextHook']);
    return editing.mode === 'create' ? createScenePlan(projectId, sceneId, input) : updateScenePlan(projectId, editing.item.id, input);
  }
  if (editing.kind === 'version') {
    const content = normalizeString(values.content);
    if (!content) throw new Error('请填写正文');
    const source = normalizeString(values.source) ?? 'user';
    if (!['user', 'imported', 'ai'].includes(source)) throw new Error('来源只能选择“手动记录、导入内容、智能辅助”。');
    const wordCount = typeof values.wordCount === 'number' ? values.wordCount : undefined;
    const input: SceneVersionInput = { content, source, wordCount, changeSummary: normalizeString(values.changeSummary), basedOnVersionId: normalizeString(values.basedOnVersionId) };
    return editing.mode === 'create' ? createSceneVersion(projectId, sceneId, input) : updateSceneVersion(projectId, editing.item.id, input);
  }
  if (editing.kind === 'summary') {
    const summary = normalizeString(values.summary);
    if (!summary) throw new Error('请填写摘要');
    const input: SceneSummaryInput = {
      sceneVersionId: normalizeString(values.sceneVersionId) ?? currentVersionId ?? undefined,
      summary,
      keyEvents: parseStructuredField(values.keyEventsText),
      characterChanges: parseStructuredField(values.characterChangesText),
      newFacts: parseStructuredField(values.newFactsText),
      createdBy: 'user',
    };
    stripUndefined(input);
    return editing.mode === 'create' ? createSceneSummary(projectId, sceneId, input) : updateSceneSummary(projectId, editing.item.id, input);
  }
  const input: SceneHandoffInput = {
    sceneVersionId: normalizeString(values.sceneVersionId) ?? currentVersionId ?? undefined,
    nextSceneId: normalizeString(values.nextSceneId),
    readerKnows: parseStructuredField(values.readerKnowsText),
    actualChanges: parseStructuredField(values.actualChangesText),
    openQuestions: parseStructuredField(values.openQuestionsText),
    nextSceneMust: parseStructuredField(values.nextSceneMustText),
    riskNotes: parseStructuredField(values.riskNotesText),
    createdBy: 'user',
  };
  stripUndefined(input);
  return editing.mode === 'create' ? createSceneHandoff(projectId, sceneId, input) : updateSceneHandoff(projectId, editing.item.id, input);
}

function normalizeChapterInput(values: Record<string, unknown>, isCreate: boolean): ChapterInput {
  const input: ChapterInput = { title: normalizeString(values.title) ?? undefined, plannedTitle: normalizeString(values.plannedTitle), goal: normalizeString(values.goal), orderIndex: typeof values.orderIndex === 'number' ? values.orderIndex : undefined, status: normalizeString(values.status) ?? undefined };
  if (!input.title) throw new Error('请填写章节标题');
  if (isCreate) {
    if (input.plannedTitle === null) delete input.plannedTitle;
    if (input.goal === null) delete input.goal;
  }
  if (input.orderIndex === undefined || input.orderIndex === null) delete input.orderIndex;
  return input;
}

function normalizeSceneInput(values: Record<string, unknown>): SceneInput {
  const input: SceneInput = {
    title: normalizeString(values.title),
    goal: normalizeString(values.goal),
    orderIndex: typeof values.orderIndex === 'number' ? values.orderIndex : undefined,
    status: normalizeString(values.status) ?? undefined,
    storyTimeLabel: normalizeString(values.storyTimeLabel),
    povCharacterId: normalizeString(values.povCharacterId),
    primaryLocationId: normalizeString(values.primaryLocationId),
  };
  if (input.orderIndex === undefined || input.orderIndex === null) delete input.orderIndex;
  return input;
}

function normalizeSummaryInput(values: Record<string, unknown>): ChapterSummaryInput {
  const summary = normalizeString(values.summary);
  if (!summary) throw new Error('请填写章节摘要');
  const input: ChapterSummaryInput = { summary, chapterVersionId: normalizeString(values.chapterVersionId), keyEvents: parseStructuredField(values.keyEventsText), characterChanges: parseStructuredField(values.characterChangesText), newFacts: parseStructuredField(values.newFactsText), createdBy: 'user' };
  stripUndefined(input);
  return input;
}

function summaryInitialValues(editing: EditingSummaryState, currentVersionId?: string | null) {
  if (editing.mode === 'create') return { chapterVersionId: currentVersionId ?? undefined };
  return { summary: editing.summary.summary, chapterVersionId: editing.summary.chapterVersionId ?? undefined, keyEventsText: jsonText(editing.summary.keyEvents), characterChangesText: jsonText(editing.summary.characterChanges), newFactsText: jsonText(editing.summary.newFacts) };
}

function resourceInitialValues(editing: EditingSceneResourceState, currentVersionId?: string | null) {
  if (editing.mode === 'create') return editing.kind === 'version' ? { source: 'user' } : editing.kind === 'summary' || editing.kind === 'handoff' ? { sceneVersionId: currentVersionId ?? undefined } : {};
  const item = editing.item;
  if (editing.kind === 'summary') {
    const summary = item as SceneSummary;
    return { sceneVersionId: summary.sceneVersionId ?? currentVersionId ?? undefined, summary: summary.summary, keyEventsText: displayValue(summary.keyEvents), characterChangesText: displayValue(summary.characterChanges), newFactsText: displayValue(summary.newFacts) };
  }
  if (editing.kind === 'handoff') {
    const handoff = item as SceneHandoff;
    return { sceneVersionId: handoff.sceneVersionId ?? currentVersionId ?? undefined, nextSceneId: handoff.nextSceneId ?? undefined, readerKnowsText: displayValue(handoff.readerKnows), actualChangesText: displayValue(handoff.actualChanges), openQuestionsText: displayValue(handoff.openQuestions), nextSceneMustText: displayValue(handoff.nextSceneMust), riskNotesText: displayValue(handoff.riskNotes) };
  }
  return item;
}

function nextSuggestions(chapter?: Chapter, profile?: ChapterProfile, progress?: SceneProgress): NextSuggestion[] {
  if (!chapter) return [{ kind: 'createScene', label: '新增章节' }];
  if (!progress || progress.sceneCount === 0) return [{ kind: 'createScene', label: '添加场景' }];
  const missingPlan = progress.scenes.find((scene) => !scene.currentPlanId);
  if (missingPlan) return [{ kind: 'sceneTask', label: `补场景计划：#${missingPlan.orderIndex}`, sceneId: missingPlan.id, sceneTab: 'plan' }];
  const missingBody = progress.scenes.find((scene) => !scene.currentVersionId || !progress.profiles[scene.id]?.currentVersion);
  if (missingBody) return [{ kind: 'sceneTask', label: `写正文：#${missingBody.orderIndex}`, sceneId: missingBody.id, sceneTab: 'version' }];
  const missingSummary = progress.scenes.find((scene) => !progress.profiles[scene.id]?.latestSummary);
  if (missingSummary) return [{ kind: 'sceneTask', label: `确认摘要：#${missingSummary.orderIndex}`, sceneId: missingSummary.id, sceneTab: 'summary' }];
  const missingHandoff = progress.scenes.find((scene) => !progress.profiles[scene.id]?.latestHandoff);
  if (missingHandoff) return [{ kind: 'sceneTask', label: `补交接：#${missingHandoff.orderIndex}`, sceneId: missingHandoff.id, sceneTab: 'handoff' }];
  if (!chapter.currentVersionId) return [{ kind: 'assembleChapter', label: '装配章节正文' }];
  if (!profile?.currentSummary) return [{ kind: 'rollupSummary', label: '汇总章节摘要' }];
  return [{ kind: 'chapterComplete', label: '本章完成，进入下一章' }];
}

function normalizeNullableFields(values: Record<string, unknown>, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, normalizeString(values[field])])) as Record<string, string | null | undefined>;
}

function normalizeString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function parseStructuredField(value: unknown) {
  const text = normalizeString(value);
  if (!text) return undefined;
  try { return JSON.parse(text); } catch { return text; }
}

function stripUndefined<T extends object>(record: T) {
  Object.keys(record).forEach((key) => { if ((record as Record<string, unknown>)[key] === undefined) delete (record as Record<string, unknown>)[key]; });
}

function jsonText(value: unknown) {
  if (value === undefined || value === null) return undefined;
  return JSON.stringify(value, null, 2);
}

function itemsFromResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  return [];
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join('、');
  if (typeof value === 'object') return Object.entries(value as Record<string, unknown>).filter(([, entry]) => displayValue(entry)).map(([key, entry]) => `${key}：${displayValue(entry)}`).join('\n');
  return String(value);
}

function filterRelevantDrafts(drafts: GeneratedDraft[], chapterId?: string, sceneId?: string) {
  return drafts.filter((draft) => {
    if (draft.status !== 'pending') return false;
    if (draft.targetType === 'chapter_version' || draft.targetType === 'chapter_summary') return Boolean(chapterId && draft.targetId === chapterId);
    if (draft.targetType === 'scene_version' || draft.targetType === 'scene_plan') return Boolean(sceneId && draft.targetId === sceneId);
    return false;
  });
}

function parseJsonObject(text: string) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Payload 必须是 JSON object');
  return parsed;
}

function safeStringify(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function draftPayloadPreview(value: unknown) {
  if (!value || typeof value !== 'object') return '';
  const record = value as Record<string, unknown>;
  const content = typeof record.content === 'string' ? record.content : typeof record.summary === 'string' ? record.summary : '';
  return content || safeStringify(value);
}

function draftTargetLabel(targetType: string) {
  if (targetType === 'chapter_version') return '章节正文';
  if (targetType === 'scene_version') return '场景正文';
  if (targetType === 'scene_plan') return '场景计划';
  if (targetType === 'chapter_summary') return '章节摘要';
  return targetType;
}

function entityLabel(entity: Record<string, unknown> | null | undefined, fallback?: string | null) {
  if (!entity) return fallback ?? undefined;
  return String(entity.name ?? entity.title ?? entity.id ?? fallback ?? '');
}

function planLabel(plan: ScenePlan) {
  return plan.title || plan.goal || '未命名计划';
}

function versionLabel(version: SceneVersion) {
  return version.changeSummary || `正文版本 · ${version.wordCount ?? countWords(version.content)} 字 · ${shortId(version.id)}`;
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function shortId(value: string) {
  return value.slice(-6);
}

function shortText(value: string | undefined | null, length: number) {
  const text = value?.trim() ?? '';
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function tabLabel(tab: DetailTab) {
  if (tab === 'flow') return '写作流';
  if (tab === 'body') return '章节正文';
  if (tab === 'summaries') return '章节摘要';
  if (tab === 'versions') return '版本记录';
  return '概览';
}

function sceneTabLabel(tab: SceneDetailTab) {
  if (tab === 'plan') return '计划';
  if (tab === 'version') return '正文';
  if (tab === 'summary') return '摘要';
  return '交接';
}

function summaryActionLabel(action: 'confirm' | 'archive' | 'restore' | 'delete') {
  if (action === 'confirm') return '章节摘要已确认';
  if (action === 'archive') return '章节摘要已归档';
  if (action === 'restore') return '章节摘要已恢复';
  return '章节摘要已删除';
}

function actionLabel(action: 'confirm' | 'archive' | 'restore') {
  if (action === 'confirm') return '确认';
  if (action === 'archive') return '归档';
  return '恢复';
}

function countWords(content: string) {
  return content.replace(/\s+/g, '').length;
}

function textareaStyle(minHeight: number | string): React.CSSProperties {
  return { width: '100%', boxSizing: 'border-box', minHeight, resize: 'vertical', padding: 14, border: '1px solid var(--semi-color-border)', borderRadius: 10, color: 'var(--semi-color-text-0)', background: 'var(--semi-color-bg-0)', lineHeight: 1.8, fontSize: 15 };
}

const writingTextareaStyle: React.CSSProperties = { minHeight: '52vh', lineHeight: 1.8, fontSize: 15 };
const longTextareaStyle: React.CSSProperties = { minHeight: 140, lineHeight: 1.7 };

const fieldLabelStyle: React.CSSProperties = { display: 'block', marginBottom: 4, fontWeight: 600, color: 'var(--semi-color-text-0)' };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid var(--semi-color-border)', borderRadius: 8, color: 'var(--semi-color-text-0)', background: 'var(--semi-color-bg-0)' };

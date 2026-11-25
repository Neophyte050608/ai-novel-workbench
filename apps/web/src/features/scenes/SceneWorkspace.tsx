import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Form,
  Notification,
  Popconfirm,
  Select,
  SideSheet,
  Skeleton,
  Space,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconDelete, IconEdit, IconPlus } from '@douyinfe/semi-icons';
import { StatusTag, statusLabel, statusOptions } from '../../shared/ui/StatusTag';
import { listChapters } from '../chapters/api';
import type { Chapter } from '../chapters/types';
import { listCharacters, listLocations } from '../projects/api';
import type { Character, Location } from '../projects/types';
import {
  activateScenePlan,
  activateSceneVersion,
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
  updateScene,
  updateSceneHandoff,
  updateScenePlan,
  updateSceneSummary,
  updateSceneVersion,
} from './api';
import type {
  Scene,
  SceneHandoff,
  SceneHandoffInput,
  SceneInput,
  ScenePlan,
  ScenePlanInput,
  SceneProfile,
  SceneSummary,
  SceneSummaryInput,
  SceneVersion,
  SceneVersionInput,
} from './types';

const { Title, Text, Paragraph } = Typography;
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type SceneChildKind = 'plans' | 'versions' | 'summaries' | 'handoffs';
type SceneChild = ScenePlan | SceneVersion | SceneSummary | SceneHandoff;
type SceneChildInput = ScenePlanInput | SceneVersionInput | SceneSummaryInput | SceneHandoffInput;
type SceneChildConfig<T extends SceneChild = SceneChild> = {
  kind: SceneChildKind;
  title: string;
  addLabel: string;
  fields: SceneField[];
  requiredFields?: string[];
  longFields?: string[];
  jsonFields?: string[];
  defaults?: Record<string, unknown>;
  getTitle: (item: T) => string;
  getSummary?: (item: T) => string | undefined;
  canActivate?: boolean;
};
type SelectOption = { label: string; value: string };
type SceneField = { key: string; label: string; long?: boolean; options?: SelectOption[]; placeholder?: string };

type DraftChild = { id: string; fields: Record<string, unknown> };
type EditingSceneState = { mode: 'create'; chapterId: string } | { mode: 'edit'; chapterId: string; scene: Scene };
type EditingChildState = { item: SceneChild | DraftChild; projectId: string; sceneId: string; kind: SceneChildKind };

const sceneStatusOptions = statusOptions(['planned', 'writing', 'reviewing', 'done'] as const);

const sceneSourceOptions = [
  { label: '手动记录', value: 'user' },
  { label: '导入内容', value: 'imported' },
  { label: '智能辅助', value: 'ai' },
];

const sceneFields: SceneField[] = [
  { key: 'title', label: '场景标题' },
  { key: 'status', label: '状态', options: sceneStatusOptions },
  { key: 'orderIndex', label: '排序' },
  { key: 'goal', label: '场景目标', long: true },
  { key: 'storyTimeLabel', label: '故事时间' },
  { key: 'povCharacterId', label: 'POV 人物' },
  { key: 'primaryLocationId', label: '主要地点' },
];

const childConfigs: Record<SceneChildKind, SceneChildConfig> = {
  plans: {
    kind: 'plans',
    title: '场景计划',
    addLabel: '新增场景计划',
    canActivate: true,
    fields: [
      { key: 'title', label: '标题' },
      { key: 'orderIndex', label: '排序' },
      { key: 'goal', label: '目标', long: true },
      { key: 'outline', label: '梗概', long: true },
      { key: 'conflict', label: '冲突', long: true },
      { key: 'choice', label: '选择', long: true },
      { key: 'consequence', label: '后果', long: true },
      { key: 'readerPromise', label: '读者期待', long: true },
      { key: 'readerPayoff', label: '读者回报', long: true },
      { key: 'nextHook', label: '下一场钩子', long: true },
      { key: 'constraints', label: '补充要求', long: true, placeholder: '可写节奏、视角、禁忌或必须保留的信息' },
    ],
    longFields: ['goal', 'outline', 'conflict', 'choice', 'consequence', 'readerPromise', 'readerPayoff', 'nextHook', 'constraints'],
    jsonFields: ['constraints'],
    getTitle: (item) => (item as ScenePlan).title || (item as ScenePlan).goal || '未命名计划',
    getSummary: (item) => (item as ScenePlan).outline || (item as ScenePlan).conflict || undefined,
  },
  versions: {
    kind: 'versions',
    title: '正文版本',
    addLabel: '新增正文版本',
    canActivate: true,
    requiredFields: ['content'],
    fields: [
      { key: 'source', label: '来源', options: sceneSourceOptions },
      { key: 'wordCount', label: '字数' },
      { key: 'basedOnVersionId', label: '基于正文版本' },
      { key: 'changeSummary', label: '变更说明', long: true },
      { key: 'content', label: '正文', long: true },
    ],
    longFields: ['changeSummary', 'content'],
    defaults: { source: 'user' },
    getTitle: (item) => `版本 ${(item as SceneVersion).wordCount ?? countText((item as SceneVersion).content)} 字`,
    getSummary: (item) => (item as SceneVersion).changeSummary || (item as SceneVersion).content,
  },
  summaries: {
    kind: 'summaries',
    title: '场景摘要',
    addLabel: '新增场景摘要',
    requiredFields: ['summary'],
    fields: [
      { key: 'sceneVersionId', label: '关联正文版本' },
      { key: 'createdBy', label: '创建者' },
      { key: 'summary', label: '摘要', long: true },
      { key: 'keyEvents', label: '关键事件', long: true },
      { key: 'characterChanges', label: '人物变化', long: true },
      { key: 'locationChanges', label: '地点变化', long: true },
      { key: 'factionChanges', label: '势力变化', long: true },
      { key: 'worldRuleChanges', label: '世界规则变化', long: true },
      { key: 'newFacts', label: '新增事实', long: true },
      { key: 'readerVisibleInfo', label: '读者已知信息', long: true },
    ],
    jsonFields: ['keyEvents', 'characterChanges', 'locationChanges', 'factionChanges', 'worldRuleChanges', 'newFacts', 'readerVisibleInfo'],
    getTitle: (item) => shortText((item as SceneSummary).summary, 24) || '摘要',
    getSummary: (item) => (item as SceneSummary).summary,
  },
  handoffs: {
    kind: 'handoffs',
    title: '场景交接',
    addLabel: '新增场景交接',
    fields: [
      { key: 'sceneVersionId', label: '关联正文版本' },
      { key: 'nextSceneId', label: '下一场景' },
      { key: 'createdBy', label: '创建者' },
      { key: 'readerKnows', label: '读者已知信息', long: true },
      { key: 'actualChanges', label: '实际变化', long: true },
      { key: 'openQuestions', label: '未解问题', long: true },
      { key: 'promisesOpened', label: '新开期待', long: true },
      { key: 'promisesClosed', label: '兑现期待', long: true },
      { key: 'nextSceneMust', label: '下一场景必须处理', long: true },
      { key: 'riskNotes', label: '风险备注', long: true },
    ],
    jsonFields: ['readerKnows', 'actualChanges', 'openQuestions', 'promisesOpened', 'promisesClosed', 'nextSceneMust', 'riskNotes'],
    getTitle: (item) => shortText(displayValue((item as SceneHandoff).nextSceneMust) || displayValue((item as SceneHandoff).readerKnows), 24) || '交接',
    getSummary: (item) => displayValue((item as SceneHandoff).readerKnows) || displayValue((item as SceneHandoff).openQuestions),
  },
};

export function SceneWorkspace({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersLoaded, setChaptersLoaded] = useState(false);
  const [appliedChapterId, setAppliedChapterId] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [profile, setProfile] = useState<SceneProfile>();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingScene, setEditingScene] = useState<EditingSceneState>();
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();
  const scenesRequestSeq = useRef(0);
  const profileRequestSeq = useRef(0);
  const appliedChapterIdRef = useRef('');
  const selectedIdRef = useRef<string>();
  const profileRef = useRef<SceneProfile>();

  const setSelectedSceneId = useCallback((id?: string) => {
    if (selectedIdRef.current !== id) {
      profileRequestSeq.current += 1;
      profileRef.current = undefined;
      setProfile(undefined);
      setProfileLoading(false);
    }
    selectedIdRef.current = id;
    setSelectedId(id);
  }, []);

  const setCurrentProfile = useCallback((nextProfile?: SceneProfile) => {
    profileRef.current = nextProfile;
    setProfile(nextProfile);
  }, []);

  const refreshChapters = useCallback(async () => {
    setChaptersLoading(true);
    try {
      const next = await listChapters(projectId);
      setChapters(next);
      setChaptersLoaded(true);
      const currentChapterId = appliedChapterIdRef.current.trim();
      if (!currentChapterId && next[0]) {
        appliedChapterIdRef.current = next[0].id;
        setAppliedChapterId(next[0].id);
      } else if (currentChapterId && !next.some((chapter) => chapter.id === currentChapterId)) {
        scenesRequestSeq.current += 1;
        profileRequestSeq.current += 1;
        appliedChapterIdRef.current = '';
        setAppliedChapterId('');
        setScenes([]);
        setSelectedSceneId(undefined);
        setCurrentProfile(undefined);
      }
    } catch (error) {
      setChapters([]);
      setChaptersLoaded(true);
      Notification.error({ title: '章节加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setChaptersLoading(false);
    }
  }, [projectId, setCurrentProfile, setSelectedSceneId]);

  useEffect(() => {
    refreshChapters();
  }, [refreshChapters]);

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

  const selectedScene = useMemo(() => scenes.find((scene) => scene.id === selectedId), [scenes, selectedId]);
  const selectedChapter = useMemo(() => chapters.find((chapter) => chapter.id === appliedChapterId), [chapters, appliedChapterId]);
  const sceneLookupOptions = useMemo<Record<string, SelectOption[]>>(() => ({
    povCharacterId: characters.map((character) => ({ value: character.id, label: character.name })),
    primaryLocationId: locations.map((location) => ({ value: location.id, label: location.name })),
  }), [characters, locations]);

  const refreshScenes = useCallback(async (preferredId?: string) => {
    const chapterForRequest = appliedChapterIdRef.current.trim();
    if (!chapterForRequest) return;
    const requestId = ++scenesRequestSeq.current;
    setLoading(true);
    try {
      const next = await listScenes(projectId, chapterForRequest);
      if (requestId !== scenesRequestSeq.current || chapterForRequest !== appliedChapterIdRef.current.trim()) return;
      setScenes(next);
      if (selectedIdRef.current && profileRef.current?.scene.id === selectedIdRef.current && profileRef.current.scene.chapterId !== chapterForRequest) {
        profileRequestSeq.current += 1;
        setCurrentProfile(undefined);
        setProfileLoading(false);
      }
      const currentSelectedId = selectedIdRef.current;
      setSelectedSceneId(preferredId ?? (currentSelectedId && next.some((scene) => scene.id === currentSelectedId) ? currentSelectedId : next[0]?.id));
    } catch (error) {
      if (requestId !== scenesRequestSeq.current || chapterForRequest !== appliedChapterIdRef.current.trim()) return;
      setScenes([]);
      setSelectedSceneId(undefined);
      setCurrentProfile(undefined);
      Notification.error({ title: '场景加载失败', content: String((error as Error).message ?? error) });
    } finally {
      if (requestId === scenesRequestSeq.current && chapterForRequest === appliedChapterIdRef.current.trim()) setLoading(false);
    }
  }, [projectId, setCurrentProfile, setSelectedSceneId]);

  useEffect(() => {
    refreshScenes();
  }, [appliedChapterId, refreshScenes]);

  const refreshProfile = useCallback(async () => {
    const sceneIdForRequest = selectedIdRef.current;
    if (!sceneIdForRequest) {
      profileRequestSeq.current += 1;
      setCurrentProfile(undefined);
      return;
    }
    const requestId = ++profileRequestSeq.current;
    setProfileLoading(true);
    try {
      const nextProfile = await getSceneProfile(projectId, sceneIdForRequest);
      if (requestId !== profileRequestSeq.current || sceneIdForRequest !== selectedIdRef.current || nextProfile.scene.chapterId !== appliedChapterIdRef.current.trim()) return;
      setCurrentProfile(nextProfile);
    } catch (error) {
      if (requestId !== profileRequestSeq.current || sceneIdForRequest !== selectedIdRef.current) return;
      setCurrentProfile(undefined);
      Notification.error({ title: '场景详情加载失败', content: String((error as Error).message ?? error) });
    } finally {
      if (requestId === profileRequestSeq.current && sceneIdForRequest === selectedIdRef.current) setProfileLoading(false);
    }
  }, [projectId, setCurrentProfile]);

  useEffect(() => {
    refreshProfile();
  }, [selectedId, refreshProfile]);

  function selectChapter(nextChapterId: string) {
    const id = nextChapterId.trim();
    if (!id) return;
    const isSameChapter = id === appliedChapterIdRef.current.trim();
    scenesRequestSeq.current += 1;
    profileRequestSeq.current += 1;
    appliedChapterIdRef.current = id;
    setAppliedChapterId(id);
    setScenes([]);
    setSelectedSceneId(undefined);
    setCurrentProfile(undefined);
    if (isSameChapter) void refreshScenes();
  }

  function openCreateScene() {
    const currentChapterId = appliedChapterIdRef.current.trim();
    if (!currentChapterId) {
      Notification.warning({ title: '请先选择章节' });
      return;
    }
    setEditingScene({ mode: 'create', chapterId: currentChapterId });
  }

  function openEditScene(scene: Scene) {
    setEditingScene({ mode: 'edit', chapterId: appliedChapterIdRef.current.trim(), scene });
  }

  async function saveScene() {
    if (!formApi || !editingScene) return;
    if (editingScene.chapterId !== appliedChapterIdRef.current.trim()) {
      Notification.warning({ title: '章节已切换', content: '请重新打开编辑抽屉后再保存。' });
      setEditingScene(undefined);
      return;
    }
    if (editingScene.mode === 'edit' && editingScene.scene.id !== selectedIdRef.current) {
      Notification.warning({ title: '场景已切换', content: '请重新打开编辑抽屉后再保存。' });
      setEditingScene(undefined);
      return;
    }
    const values = await formApi.validate() as Record<string, unknown>;
    const input = normalizeSceneInput(values);
    setSaving(true);
    try {
      const saved = editingScene.mode === 'create'
        ? await createScene(projectId, editingScene.chapterId, input)
        : await updateScene(projectId, editingScene.scene.id, input);
      Notification.success({ title: '场景已保存' });
      setEditingScene(undefined);
      await refreshScenes(saved.id);
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
      await refreshScenes();
    } catch (error) {
      Notification.error({ title: '场景删除失败', content: String((error as Error).message ?? error) });
    }
  }

  return <div>
    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 16 }}>
      <div>
        <Title heading={3} style={{ margin: 0 }}>场景库</Title>
        <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>跨章节检索与批量维护场景；日常写作请从“章节写作”进入，在章节上下文内完成场景写作闭环。</Text>
      </div>
      <Space>
        <Button theme="solid" type="primary" icon={<IconPlus />} onClick={openCreateScene} disabled={!appliedChapterId}>新增场景</Button>
      </Space>
    </section>

    <Card style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: 12 }}>
      <Space wrap spacing={8} style={{ width: '100%', rowGap: 8 }}>
        <Select value={appliedChapterId || undefined} onChange={(value) => selectChapter(String(value))} placeholder={chaptersLoading ? '章节加载中…' : '选择章节'} loading={chaptersLoading} disabled={chaptersLoading || chapters.length === 0} style={{ width: 360 }}>
          {chapters.map((chapter) => <Select.Option key={chapter.id} value={chapter.id}>{chapterLabel(chapter)}</Select.Option>)}
        </Select>
        {selectedChapter ? <Tag color="blue">当前章节：{selectedChapter.title}</Tag> : chaptersLoaded && chapters.length === 0 ? <Text type="tertiary">暂无章节，请先到“章节”工作台创建章节。</Text> : <Text type="tertiary">选择章节后即可管理该章节的场景。</Text>}
      </Space>
    </Card>

    <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 16 }}>
      <Card style={{ borderRadius: 12, minHeight: 560 }} bodyStyle={{ padding: 12 }}>
        {!appliedChapterId ? <EmptyState title="未选择章节" description={chaptersLoaded && chapters.length === 0 ? '暂无章节，请先到“章节”工作台创建章节。' : '请先从上方选择章节。'} /> : loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading /> : scenes.length === 0 ? <EmptyState title="暂无场景" description="点击右上角新增场景。" /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scenes.map((scene) => <button key={scene.id} type="button" onClick={() => setSelectedSceneId(scene.id)} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${scene.id === selectedId ? 'var(--semi-color-primary-light-active)' : 'var(--semi-color-border)'}`, background: scene.id === selectedId ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', cursor: 'pointer' }}>
            <Text strong ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>{scene.title || `场景 #${scene.orderIndex}`}</Text>
            <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ display: 'block', marginTop: 4 }}>{scene.goal || scene.storyTimeLabel || '未填写场景目标'}</Text>
            <Space spacing={4} style={{ marginTop: 8 }}>
              <Tag size="small">#{scene.orderIndex}</Tag>
              <StatusTag status={scene.status} label={sceneStatusLabel(scene.status)} />
              {scene.canonStatus ? <StatusTag status={scene.canonStatus} label={canonStatusLabel(scene.canonStatus)} /> : null}
            </Space>
          </button>)}
        </div>}
      </Card>

      <Card style={{ borderRadius: 12, minHeight: 560 }} bodyStyle={{ padding: 20 }}>
        {!selectedScene ? <EmptyState title="未选择场景" description="从左侧选择场景，或新增一条。" /> : <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div>
              <Title heading={4} style={{ margin: 0 }}>{selectedScene.title || `场景 #${selectedScene.orderIndex}`}</Title>
              <Text type="tertiary">{selectedScene.goal || selectedScene.storyTimeLabel || '未填写场景目标'}</Text>
            </div>
            <Space>
              <Button icon={<IconEdit />} onClick={() => openEditScene(selectedScene)}>编辑</Button>
              <Popconfirm title="确认删除这个场景？" content="删除后会从当前章节列表移除。" onConfirm={() => handleDeleteScene(selectedScene)}><Button icon={<IconDelete />} type="danger" theme="borderless">删除</Button></Popconfirm>
            </Space>
          </div>
          <SceneProfilePanel profile={profile} loading={profileLoading} fallbackScene={selectedScene} />
          <div style={{ marginTop: 18, display: 'grid', gap: 16 }}>
            {(Object.keys(childConfigs) as SceneChildKind[]).map((kind) => <SceneChildSection key={`${selectedScene.id}:${kind}`} projectId={projectId} sceneId={selectedScene.id} scenes={scenes} config={childConfigs[kind]} profile={profile} onChanged={() => { refreshProfile(); refreshScenes(selectedScene.id); }} />)}
          </div>
        </>}
      </Card>
    </div>

    <SideSheet title={editingScene?.mode === 'create' ? '新增场景' : '编辑场景'} visible={Boolean(editingScene)} onCancel={() => setEditingScene(undefined)} width={560} footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={() => setEditingScene(undefined)}>取消</Button><Button theme="solid" type="primary" loading={saving} onClick={saveScene}>保存</Button></div>}>
      {editingScene ? <Form key={editingScene.mode === 'create' ? `new:${editingScene.chapterId}` : editingScene.scene.id} initValues={editingScene.mode === 'create' ? { status: 'planned', orderIndex: nextSceneOrderIndex(scenes) } : editingScene.scene} getFormApi={setFormApi} labelPosition="top"><SceneFieldsForm fields={sceneFields} requiredFields={[]} jsonFields={[]} lookupOptions={sceneLookupOptions} /></Form> : null}
    </SideSheet>
  </div>;
}

function SceneProfilePanel({ profile, loading, fallbackScene }: { profile?: SceneProfile; loading: boolean; fallbackScene: Scene }) {
  const scene = profile?.scene ?? fallbackScene;
  if (loading) return <Skeleton placeholder={<Skeleton.Paragraph rows={4} />} loading />;
  const readiness = profile?.readiness;
  const readinessWarnings = readiness?.warnings.map(readinessWarningLabel) ?? [];
  const needsConfirmationAbility = readiness?.warnings.some((message) => message === 'Scene has no confirmed summary available for context.' || message === 'Scene has no confirmed handoff available for context.') ?? false;
  return <section style={{ padding: 14, border: '1px solid var(--semi-color-border)', borderRadius: 12, background: 'var(--semi-color-fill-0)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
      <Title heading={5} style={{ margin: 0 }}>场景准备度</Title>
      {readiness ? <Tag color={readiness.ready ? 'green' : 'orange'}>{readiness.score}/{readiness.total}</Tag> : <Tag>未加载</Tag>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
      <InfoCell label="状态" value={sceneStatusLabel(scene.status)} />
      <InfoCell label="目标" value={scene.goal} />
      <InfoCell label="故事时间" value={scene.storyTimeLabel} />
      <InfoCell label="POV" value={entityLabel(profile?.povCharacter, scene.povCharacterId)} />
      <InfoCell label="地点" value={entityLabel(profile?.primaryLocation, scene.primaryLocationId)} />
      <InfoCell label="当前计划" value={profile?.currentPlan ? childConfigs.plans.getTitle(profile.currentPlan) : undefined} />
      <InfoCell label="当前正文" value={profile?.currentVersion ? childConfigs.versions.getTitle(profile.currentVersion) : undefined} />
      <InfoCell label="最新摘要" value={profile?.latestSummary?.summary} />
      <InfoCell label="最新交接" value={profile?.latestHandoff ? childConfigs.handoffs.getSummary?.(profile.latestHandoff) : undefined} />
    </div>
    {readiness ? <div style={{ marginTop: 12 }}><Space wrap spacing={6} style={{ rowGap: 6 }}>{readiness.items.map((item) => <Tag key={item.key} color={item.ready ? 'green' : 'orange'}>{readinessItemLabel(item)}</Tag>)}</Space>{readinessWarnings.length > 0 ? <Paragraph type="tertiary" style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{readinessWarnings.join('\n')}</Paragraph> : null}{needsConfirmationAbility ? <Paragraph type="tertiary" style={{ margin: '8px 0 0' }}>补充并确认摘要、交接后，场景准备度会更完整。</Paragraph> : null}</div> : null}
  </section>;
}

function SceneChildSection({ projectId, sceneId, scenes, config, profile, onChanged }: { projectId: string; sceneId: string; scenes: Scene[]; config: SceneChildConfig; profile?: SceneProfile; onChanged: () => void }) {
  const [items, setItems] = useState<SceneChild[]>([]);
  const [versionOptions, setVersionOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<EditingChildState>();
  const [changedFields, setChangedFields] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();

  const activeId = config.kind === 'plans' ? profile?.scene.currentPlanId : config.kind === 'versions' ? profile?.scene.currentVersionId : undefined;
  const childLookupOptions = useMemo<Record<string, SelectOption[]>>(() => {
    const versions = config.kind === 'versions'
      ? items.filter((item): item is SceneVersion => 'content' in item).map((item) => ({ value: item.id, label: versionLabel(item) }))
      : versionOptions;
    return {
      basedOnVersionId: versions,
      sceneVersionId: versions,
      nextSceneId: scenes.filter((scene) => scene.id !== sceneId).map((scene) => ({ value: scene.id, label: scene.title || `场景 #${scene.orderIndex}` })),
    };
  }, [config.kind, items, sceneId, scenes, versionOptions]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listChildren(projectId, sceneId, config.kind));
    } catch (error) {
      setItems([]);
      Notification.error({ title: `${config.title} 加载失败`, content: String((error as Error).message ?? error) });
    } finally {
      setLoading(false);
    }
  }, [config.kind, config.title, projectId, sceneId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (config.kind === 'versions') return;
    let cancelled = false;
    listSceneVersions(projectId, sceneId)
      .then((versions) => {
        if (!cancelled) setVersionOptions(versions.map((version) => ({ value: version.id, label: versionLabel(version) })));
      })
      .catch(() => {
        if (!cancelled) setVersionOptions([]);
      });
    return () => { cancelled = true; };
  }, [config.kind, projectId, sceneId]);

  async function saveItem() {
    if (!formApi || !editingItem) return;
    if (editingItem.projectId !== projectId || editingItem.sceneId !== sceneId || editingItem.kind !== config.kind) {
      Notification.warning({ title: `${config.title} 上下文已变化`, content: '请重新打开编辑抽屉后再保存。' });
      setEditingItem(undefined);
      setChangedFields(new Set());
      return;
    }
    let input: SceneChildInput;
    try {
      const values = await formApi.validate() as Record<string, unknown>;
      input = normalizeChildInput(values, config, isDraft(editingItem.item) ? undefined : editingItem.item, changedFields);
    } catch (error) {
      Notification.error({ title: `${config.title} 保存失败`, content: String((error as Error).message ?? error) });
      return;
    }
    setSaving(true);
    try {
      await saveChild(projectId, editingItem.sceneId, config.kind, editingItem.item, input);
      Notification.success({ title: `${config.title} 已保存` });
      setEditingItem(undefined);
      setChangedFields(new Set());
      await refresh();
      onChanged();
    } catch (error) {
      Notification.error({ title: `${config.title} 保存失败`, content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: SceneChild) {
    try {
      await deleteChild(projectId, config.kind, item.id);
      Notification.success({ title: `${config.title} 已删除` });
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
      onChanged();
    } catch (error) {
      Notification.error({ title: `${config.title} 删除失败`, content: String((error as Error).message ?? error) });
    }
  }

  async function activateItem(item: SceneChild) {
    try {
      if (config.kind === 'plans') await activateScenePlan(projectId, sceneId, item.id);
      if (config.kind === 'versions') await activateSceneVersion(projectId, sceneId, item.id);
      Notification.success({ title: `${config.title} 已设为当前` });
      onChanged();
    } catch (error) {
      Notification.error({ title: `${config.title} 设置当前失败`, content: String((error as Error).message ?? error) });
    }
  }

  return <section style={{ width: '100%', padding: '2px 0 14px', borderBottom: '1px solid var(--semi-color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
      <Title heading={5} style={{ margin: 0 }}>{config.title}</Title>
      <Button size="small" theme="light" type="primary" icon={<IconPlus />} onClick={() => { setChangedFields(new Set()); setEditingItem({ item: { id: `local-${Date.now()}`, fields: { ...(config.defaults ?? {}) } }, projectId, sceneId, kind: config.kind }); }}>{config.addLabel}</Button>
    </div>
    {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={3} />} loading /> : items.length === 0 ? <Text type="tertiary">暂无 {config.title}</Text> : <div style={{ display: 'grid', gap: 10 }}>
      {items.map((item) => <div key={item.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, alignItems: 'start', padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 10, background: 'var(--semi-color-bg-0)' }}>
        <div style={{ minWidth: 0 }}>
          <Space wrap spacing={6} style={{ rowGap: 6 }}>
            <Text strong>{config.getTitle(item)}</Text>
            {activeId === item.id ? <Tag color="green">当前</Tag> : null}
            {'canonStatus' in item && item.canonStatus ? <StatusTag status={item.canonStatus} label={canonStatusLabel(item.canonStatus)} /> : null}
            <Tag size="small">{formatDate(item.updatedAt)}</Tag>
          </Space>
          {config.getSummary?.(item) ? <Paragraph ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{config.getSummary?.(item)}</Paragraph> : null}
        </div>
        <Space>
          {config.canActivate ? <Button size="small" theme={activeId === item.id ? 'solid' : 'light'} type="primary" onClick={() => activateItem(item)} disabled={activeId === item.id}>设为当前</Button> : null}
          <Button icon={<IconEdit />} theme="borderless" onClick={() => { setChangedFields(new Set()); setEditingItem({ item, projectId, sceneId, kind: config.kind }); }} />
          <Popconfirm title={`确认删除${config.title}？`} content="删除后会从当前场景移除。" onConfirm={() => deleteItem(item)}><Button icon={<IconDelete />} type="danger" theme="borderless" /></Popconfirm>
        </Space>
      </div>)}
    </div>}
    <SideSheet title={editingItem && isDraft(editingItem.item) ? config.addLabel : `编辑 ${config.title}`} visible={Boolean(editingItem)} onCancel={() => { setEditingItem(undefined); setChangedFields(new Set()); }} width={childSheetWidth(config.kind)} footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={() => { setEditingItem(undefined); setChangedFields(new Set()); }}>取消</Button><Button theme="solid" type="primary" loading={saving} onClick={saveItem}>保存</Button></div>}>
      {editingItem ? <Form key={editingItem.item.id} initValues={formValues(isDraft(editingItem.item) ? editingItem.item.fields : editingItem.item, config)} getFormApi={setFormApi} labelPosition="top" onValueChange={(_, changedValue) => setChangedFields((current) => new Set([...current, ...Object.keys(changedValue)]))}><SceneFieldsForm fields={config.fields} requiredFields={config.requiredFields ?? []} jsonFields={config.jsonFields ?? []} lookupOptions={childLookupOptions} /></Form> : null}
    </SideSheet>
  </section>;
}

function SceneFieldsForm({ fields, requiredFields, jsonFields, lookupOptions = {} }: { fields: SceneField[]; requiredFields: string[]; jsonFields: string[]; lookupOptions?: Record<string, SelectOption[]> }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 16, rowGap: 2 }}>
    {fields.map((field) => {
      const rules = requiredFields.includes(field.key) ? [{ required: true, message: `请填写${field.label}` }] : undefined;
      const long = field.long;
      const helpText = jsonFields.includes(field.key) ? '可填写列表、分点或简短说明；留空会清空该字段。' : undefined;
      const options = field.options ?? lookupOptions[field.key];
      const fullRowStyle: React.CSSProperties = { gridColumn: '1 / -1', width: '100%' };
      if (long) return <Form.TextArea key={field.key} field={field.key} label={field.label} extraText={helpText} autosize={field.key === 'content' ? false : { minRows: 5, maxRows: 12 }} rows={field.key === 'content' ? 24 : undefined} fieldStyle={fullRowStyle} style={{ width: '100%' }} textareaStyle={field.key === 'content' ? writingTextareaStyle : longTextareaStyle} resize="vertical" rules={rules} />;
      if (options) return <Form.Select key={field.key} field={field.key} label={field.label} placeholder={field.placeholder ?? '请选择'} rules={rules} showClear style={{ width: '100%' }}>{options.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>;
      if (field.key === 'orderIndex' || field.key === 'wordCount') return <Form.InputNumber key={field.key} field={field.key} label={field.label} style={{ width: '100%' }} rules={rules} />;
      return <Form.Input key={field.key} field={field.key} label={field.label} placeholder={field.placeholder} rules={rules} />;
    })}
  </div>;
}

function childSheetWidth(kind: SceneChildKind) {
  return kind === 'versions' ? 'min(80vw, 900px)' : 'min(72vw, 820px)';
}

const writingTextareaStyle: React.CSSProperties = {
  minHeight: '52vh',
  lineHeight: 1.8,
  fontSize: 15,
};

const longTextareaStyle: React.CSSProperties = {
  minHeight: 140,
  lineHeight: 1.7,
};

function InfoCell({ label, value }: { label: string; value: unknown }) {
  return <div style={{ minWidth: 0 }}><Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 4 }}>{label}</Text><Paragraph type={isEmpty(value) ? 'tertiary' : undefined} ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{displayValue(value) || '未填写'}</Paragraph></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <Empty title={title} description={description} image={<IllustrationNoContent style={{ width: 112, height: 112 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 112, height: 112 }} />} />;
}

async function listChildren(projectId: string, sceneId: string, kind: SceneChildKind): Promise<SceneChild[]> {
  switch (kind) {
    case 'plans': return listScenePlans(projectId, sceneId);
    case 'versions': return listSceneVersions(projectId, sceneId);
    case 'summaries': return listSceneSummaries(projectId, sceneId);
    case 'handoffs': return listSceneHandoffs(projectId, sceneId);
  }
}

async function saveChild(projectId: string, sceneId: string, kind: SceneChildKind, editingItem: SceneChild | DraftChild, input: SceneChildInput) {
  if (isDraft(editingItem)) {
    switch (kind) {
      case 'plans': return createScenePlan(projectId, sceneId, input as ScenePlanInput);
      case 'versions': return createSceneVersion(projectId, sceneId, input as SceneVersionInput);
      case 'summaries': return createSceneSummary(projectId, sceneId, input as SceneSummaryInput);
      case 'handoffs': return createSceneHandoff(projectId, sceneId, input as SceneHandoffInput);
    }
  }
  switch (kind) {
    case 'plans': return updateScenePlan(projectId, editingItem.id, input as ScenePlanInput);
    case 'versions': return updateSceneVersion(projectId, editingItem.id, input as SceneVersionInput);
    case 'summaries': return updateSceneSummary(projectId, editingItem.id, input as SceneSummaryInput);
    case 'handoffs': return updateSceneHandoff(projectId, editingItem.id, input as SceneHandoffInput);
  }
}

async function deleteChild(projectId: string, kind: SceneChildKind, id: string) {
  switch (kind) {
    case 'plans': return deleteScenePlan(projectId, id);
    case 'versions': return deleteSceneVersion(projectId, id);
    case 'summaries': return deleteSceneSummary(projectId, id);
    case 'handoffs': return deleteSceneHandoff(projectId, id);
  }
}

function normalizeSceneInput(values: Record<string, unknown>): SceneInput {
  const input = normalizeByFields(values, sceneFields) as SceneInput;
  if (input.status === null || input.status === undefined) delete input.status;
  if (input.orderIndex === null || input.orderIndex === undefined) delete input.orderIndex;
  return input;
}

function normalizeChildInput(values: Record<string, unknown>, config: SceneChildConfig, existing?: SceneChild, changedFields: Set<string> = new Set()): SceneChildInput {
  assertRequiredFields(values, config);
  const input = normalizeByFields(values, config.fields);
  for (const key of config.jsonFields ?? []) {
    if (existing && !changedFields.has(key)) {
      delete input[key];
      continue;
    }
    input[key] = parseStructuredField(values[key]);
  }
  if (config.kind === 'versions') {
    if (input.source === null || input.source === undefined || input.source === '') {
      input.source = 'user';
    }
    if (!['user', 'imported', 'ai'].includes(String(input.source))) {
      throw new Error('来源只能选择“手动记录、导入内容、智能辅助”。');
    }
  }
  if (config.kind === 'versions' && existing && 'content' in existing && changedFields.has('content') && !changedFields.has('wordCount')) {
    delete input.wordCount;
  }
  if (input.orderIndex === null || input.orderIndex === undefined) delete input.orderIndex;
  return input as SceneChildInput;
}

function assertRequiredFields(values: Record<string, unknown>, config: SceneChildConfig) {
  for (const key of config.requiredFields ?? []) {
    const value = values[key];
    if (value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0)) {
      throw new Error(`请填写${fieldLabel(config, key)}`);
    }
  }
}

function normalizeByFields(values: Record<string, unknown>, fields: SceneField[]) {
  const input: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.key];
    if (typeof value === 'string') {
      input[field.key] = value.trim() ? value.trim() : null;
    } else if (value === undefined || value === '') {
      input[field.key] = null;
    } else {
      input[field.key] = value;
    }
  }
  return input;
}

function formValues(values: object, config: SceneChildConfig) {
  const source = values as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const field of config.fields) {
    const value = source[field.key];
    output[field.key] = config.jsonFields?.includes(field.key) ? displayValue(value) : value ?? undefined;
  }
  return output;
}

function parseStructuredField(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

function fieldLabel(config: SceneChildConfig, key: string) {
  return config.fields.find((field) => field.key === key)?.label ?? key;
}


function itemsFromResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  return [];
}

function versionLabel(version: SceneVersion) {
  return version.changeSummary || `正文版本 · ${version.wordCount ?? countText(version.content)} 字`;
}

const readinessLabels: Record<string, string> = {
  povCharacter: 'POV 人物',
  primaryLocation: '主要地点',
  currentPlan: '当前计划',
  goal: '目标',
  outline: '梗概',
  conflict: '冲突',
  choice: '选择',
  consequence: '后果',
  readerPayoff: '读者回报',
  previousHandoff: '前场交接',
};

const readinessMessages: Record<string, string> = {
  'Scene should have a valid POV character.': '需要设置有效的 POV 人物。',
  'Scene should have a valid primary location.': '需要设置有效的主要地点。',
  'Scene should have an active plan before writing.': '开始写正文前需要设置当前计划。',
  'Scene plan should state the character or scene goal.': '场景计划需要说明人物目标或场景目标。',
  'Scene plan should outline the intended action.': '场景计划需要填写行动梗概。',
  'Scene plan should include an obstacle or conflict.': '场景计划需要包含阻碍或冲突。',
  'Scene plan should include a meaningful choice.': '场景计划需要包含有意义的选择。',
  'Scene plan should include consequences.': '场景计划需要包含后果。',
  'Scene plan should include reader payoff.': '场景计划需要包含读者回报。',
  'Scene should acknowledge the previous scene handoff when there is a previous scene.': '存在前一场景时，需要确认前场交接。',
  'Scene has no confirmed summary available for context.': '暂无可用于上下文的已确认摘要。',
  'Scene has no confirmed handoff available for context.': '暂无可用于上下文的已确认交接。',
};

function readinessItemLabel(item: { key: string; message: string }) {
  return readinessLabels[item.key] ?? readinessWarningLabel(item.message);
}

function readinessWarningLabel(message: string) {
  return readinessMessages[message] ?? '准备度检查未通过，请补充场景所需信息。';
}

function nextSceneOrderIndex(scenes: Scene[]) {
  return scenes.reduce((max, scene) => Math.max(max, scene.orderIndex), -1) + 1;
}

function chapterLabel(chapter: Chapter) {
  return `#${chapter.orderIndex} ${chapter.title}`;
}

function sceneStatusLabel(status?: string | null) {
  return sceneStatusOptions.find((option) => option.value === status)?.label ?? statusLabel(status, '');
}

function canonStatusLabel(status?: string | null) {
  return statusLabel(status, '');
}

const sceneStructuredFieldLabels: Record<string, string> = {
  keyEvents: '关键事件',
  characterChanges: '人物变化',
  locationChanges: '地点变化',
  factionChanges: '势力变化',
  worldRuleChanges: '世界规则变化',
  newFacts: '新增事实',
  readerVisibleInfo: '读者已知信息',
  readerKnows: '读者已知信息',
  actualChanges: '实际变化',
  openQuestions: '未解问题',
  promisesOpened: '新开期待',
  promisesClosed: '兑现期待',
  nextSceneMust: '下一场景必须处理',
  riskNotes: '风险备注',
};

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join('、');
  if (isPlainRecord(value)) {
    return Object.entries(value)
      .filter(([, entryValue]) => !isEmpty(entryValue))
      .map(([key, entryValue]) => `${sceneStructuredFieldLabels[key] ?? key}：${displayValue(entryValue)}`)
      .join('\n');
  }
  return String(value);
}

function entityLabel(entity: Record<string, unknown> | null | undefined, fallback?: string | null) {
  if (!entity) return fallback ?? undefined;
  return String(entity.name ?? entity.title ?? entity.id ?? fallback ?? '');
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isDraft(value: SceneChild | DraftChild): value is DraftChild {
  return value.id.startsWith('local-');
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function shortText(value: string | undefined | null, length: number) {
  const text = value?.trim() ?? '';
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function countText(value: string) {
  return value.trim().length;
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

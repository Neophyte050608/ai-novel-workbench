import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Empty, Form, Notification, Popconfirm, Select, SideSheet, Skeleton, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconDelete, IconEdit, IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import { StatusTag, statusOptions } from '../../shared/ui/StatusTag';
import { activateChapterVersion, assembleChapterFromScenes, createChapter, createChapterVersion, deleteChapter, getChapterProfile, listChapters, updateChapter } from './api';
import type { AssembleChapterInput, Chapter, ChapterInput, ChapterProfile, ChapterVersion } from './types';

const { Title, Text, Paragraph } = Typography;
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type EditingChapterState = { mode: 'create' } | { mode: 'edit'; chapter: Chapter };
type DetailTab = 'overview' | 'body' | 'versions';

const chapterStatusOptions = statusOptions(['draft', 'generating', 'reviewing', 'done', 'archived'] as const);

export function ChapterWorkspace({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>();
  const [profile, setProfile] = useState<ChapterProfile>();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingChapter, setEditingChapter] = useState<EditingChapterState>();
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();
  const [draftContent, setDraftContent] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [saveAndActivate, setSaveAndActivate] = useState(true);
  const [savingVersion, setSavingVersion] = useState(false);
  const [includeSceneTitles, setIncludeSceneTitles] = useState(false);
  const [assembleActivate, setAssembleActivate] = useState(true);
  const [assembling, setAssembling] = useState(false);

  const nextOrderIndex = useMemo(() => chapters.reduce((max, chapter) => Math.max(max, chapter.orderIndex), -1) + 1, [chapters]);
  const selectedChapter = useMemo(() => chapters.find((chapter) => chapter.id === selectedChapterId), [chapters, selectedChapterId]);
  const currentVersion = profile?.currentVersion;

  const refreshChapters = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listChapters(projectId);
      setChapters(items);
      setSelectedChapterId((current) => current && items.some((chapter) => chapter.id === current) ? current : items[0]?.id);
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

  useEffect(() => {
    refreshChapters();
  }, [refreshChapters]);

  useEffect(() => {
    if (selectedChapterId) {
      refreshProfile(selectedChapterId);
    } else {
      setProfile(undefined);
      setDraftContent('');
    }
  }, [refreshProfile, selectedChapterId]);

  async function saveChapter() {
    if (!formApi || !editingChapter) return;
    setSaving(true);
    try {
      const values = await formApi.validate() as Record<string, unknown>;
      const input = normalizeChapterInput(values, editingChapter.mode === 'create');
      const visibleInput = Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'volumeId')) as ChapterInput;
      const saved = await (editingChapter.mode === 'create'
        ? createChapter(projectId, visibleInput)
        : updateChapter(projectId, editingChapter.chapter.id, visibleInput));
      Notification.success({ title: '章节已保存' });
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

  async function handleSaveVersion(activate: boolean) {
    if (!selectedChapter) return;
    if (!draftContent.trim()) {
      Notification.warning({ title: '正文不能为空' });
      return;
    }
    setSavingVersion(true);
    try {
      const version = await createChapterVersion(projectId, selectedChapter.id, { content: draftContent, changeSummary: draftSummary.trim() || undefined, source: 'user' });
      if (activate) await activateChapterVersion(projectId, selectedChapter.id, version.id);
      Notification.success({ title: activate ? '正文版本已保存并设为当前' : '正文版本已保存' });
      await Promise.all([refreshChapters(), refreshProfile(selectedChapter.id)]);
    } catch (error) {
      Notification.error({ title: '正文保存失败', content: String((error as Error).message ?? error) });
    } finally {
      setSavingVersion(false);
    }
  }

  async function handleActivateVersion(version: ChapterVersion) {
    if (!selectedChapter) return;
    try {
      await activateChapterVersion(projectId, selectedChapter.id, version.id);
      Notification.success({ title: '当前版本已更新' });
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
    setAssembling(true);
    try {
      const input: AssembleChapterInput = { includeSceneTitles, activate: assembleActivate };
      const version = await assembleChapterFromScenes(projectId, selectedChapter.id, input);
      Notification.success({ title: assembleActivate ? '已从场景装配并设为当前版本' : '已从场景装配为新版本' });
      await Promise.all([refreshChapters(), refreshProfile(selectedChapter.id)]);
      setDraftContent(version.content);
      setActiveTab('body');
    } catch (error) {
      Notification.error({ title: '从场景装配失败', content: String((error as Error).message ?? error) });
    } finally {
      setAssembling(false);
    }
  }

  return <div>
    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 16 }}>
      <div>
        <Title heading={3} style={{ margin: 0 }}>章节</Title>
        <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>Chapter 管章节元信息与发布单位；正文保存在 ChapterVersion，可从场景版本装配。</Text>
      </div>
      <Space>
        <Button icon={<IconRefresh />} onClick={() => selectedChapterId ? Promise.all([refreshChapters(), refreshProfile(selectedChapterId)]) : refreshChapters()}>刷新</Button>
        <Button theme="solid" type="primary" icon={<IconPlus />} onClick={() => setEditingChapter({ mode: 'create' })}>新增章节</Button>
      </Space>
    </section>

    <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
      <Card title="章节列表" style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 12 }}>
        {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={8} />} loading /> : chapters.length === 0 ? <Empty title="暂无章节" description="先创建章节，再到场景工作台为章节编排场景。" image={<IllustrationNoContent style={{ width: 140, height: 140 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 140, height: 140 }} />} /> : <div style={{ display: 'grid', gap: 8 }}>
          {chapters.map((chapter) => {
            const selected = chapter.id === selectedChapterId;
            return <article key={chapter.id} onClick={() => setSelectedChapterId(chapter.id)} style={{ cursor: 'pointer', display: 'grid', gap: 8, padding: 12, border: `1px solid ${selected ? 'var(--semi-color-primary)' : 'var(--semi-color-border)'}`, borderRadius: 12, background: selected ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)' }}>
              <Space wrap spacing={6} style={{ rowGap: 6 }}>
                <Title heading={6} style={{ margin: 0 }}>{chapter.title}</Title>
                <Tag size="small">#{chapter.orderIndex}</Tag>
                <StatusTag status={chapter.status} />
              </Space>
              <Paragraph type={chapter.goal ? undefined : 'tertiary'} ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{chapter.goal || '未填写章节目标'}</Paragraph>
              <Space wrap spacing={8}>
                {chapter.currentVersionId ? <Tag size="small" color="green">有当前正文</Tag> : <Tag size="small">无当前正文</Tag>}
                <Text type="tertiary" size="small">更新：{formatDate(chapter.updatedAt)}</Text>
              </Space>
            </article>;
          })}
        </div>}
      </Card>

      <Card style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 16 }}>
        {!selectedChapter ? <EmptyState title="未选择章节" description="请从左侧选择章节，或新增章节。" /> : profileLoading ? <Skeleton placeholder={<Skeleton.Paragraph rows={10} />} loading /> : <div>
          <section style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
            <div style={{ minWidth: 0 }}>
              <Space wrap spacing={8} style={{ rowGap: 8 }}>
                <Title heading={4} style={{ margin: 0 }}>{selectedChapter.title}</Title>
                <Tag>#{selectedChapter.orderIndex}</Tag>
                <StatusTag status={selectedChapter.status} />
                {currentVersion ? <Tag color="green">当前版本 {shortId(currentVersion.id)}</Tag> : <Tag>暂无当前版本</Tag>}
              </Space>
              <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>字数：{profile?.stats.currentWordCount ?? countWords(currentVersion?.content ?? '')} · 版本：{profile?.stats.versionCount ?? 0} · 场景：{profile?.stats.sceneCount ?? 0} · 当前版本时间：{formatDate(currentVersion?.updatedAt || currentVersion?.createdAt)}</Text>
            </div>
            <Space>
              <Button icon={<IconEdit />} onClick={() => setEditingChapter({ mode: 'edit', chapter: selectedChapter })}>编辑元信息</Button>
              <Popconfirm title="确认删除这个章节？" content="章节会被软删除，并从当前列表移除。" onConfirm={() => handleDeleteChapter(selectedChapter)}><Button icon={<IconDelete />} type="danger" theme="borderless">删除</Button></Popconfirm>
            </Space>
          </section>

          <Space style={{ marginBottom: 16 }}>
            {(['overview', 'body', 'versions'] as DetailTab[]).map((tab) => <Button key={tab} theme={activeTab === tab ? 'solid' : 'borderless'} type={activeTab === tab ? 'primary' : 'tertiary'} onClick={() => setActiveTab(tab)}>{tabLabel(tab)}</Button>)}
          </Space>

          {activeTab === 'overview' ? <OverviewPanel chapter={selectedChapter} profile={profile} onAssemble={handleAssembleFromScenes} includeSceneTitles={includeSceneTitles} setIncludeSceneTitles={setIncludeSceneTitles} assembleActivate={assembleActivate} setAssembleActivate={setAssembleActivate} assembling={assembling} /> : null}
          {activeTab === 'body' ? <BodyPanel content={draftContent} setContent={setDraftContent} changeSummary={draftSummary} setChangeSummary={setDraftSummary} saveAndActivate={saveAndActivate} setSaveAndActivate={setSaveAndActivate} saving={savingVersion} onSave={() => handleSaveVersion(saveAndActivate)} currentVersion={currentVersion} /> : null}
          {activeTab === 'versions' ? <VersionsPanel versions={profile?.versions ?? []} currentVersionId={profile?.chapter.currentVersionId ?? selectedChapter.currentVersionId} onPreview={handlePreviewVersion} onActivate={handleActivateVersion} /> : null}
        </div>}
      </Card>
    </div>

    <SideSheet title={editingChapter?.mode === 'create' ? '新增章节' : '编辑章节'} visible={Boolean(editingChapter)} onCancel={() => setEditingChapter(undefined)} width={560} footer={<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={() => setEditingChapter(undefined)}>取消</Button><Button theme="solid" type="primary" loading={saving} onClick={saveChapter}>保存</Button></div>}>
      {editingChapter ? <Form key={editingChapter.mode === 'create' ? 'new-chapter' : editingChapter.chapter.id} initValues={editingChapter.mode === 'create' ? { status: 'draft', orderIndex: nextOrderIndex } : editingChapter.chapter} getFormApi={setFormApi} labelPosition="top">
        <Form.Input field="title" label="章节标题" rules={[{ required: true, message: '请填写章节标题' }]} />
        <Form.Input field="plannedTitle" label="计划标题" />
        <Form.TextArea field="goal" label="章节目标" autosize={{ minRows: 3, maxRows: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <Form.InputNumber field="orderIndex" label="排序" style={{ width: '100%' }} />
          <Form.Select field="status" label="状态" style={{ width: '100%' }}>{chapterStatusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
        </div>
        <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 16 }}>所属分卷（后续接入）</Text>
        <Text type="tertiary" size="small">当前版本暂未提供分卷选择器；保存时会保留已有分卷关联，不需要手动填写 ID。</Text>
      </Form> : null}
    </SideSheet>
  </div>;
}

function OverviewPanel({ chapter, profile, onAssemble, includeSceneTitles, setIncludeSceneTitles, assembleActivate, setAssembleActivate, assembling }: {
  chapter: Chapter;
  profile?: ChapterProfile;
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
        {chapter.plannedTitle ? <Text type="tertiary">计划标题：{chapter.plannedTitle}</Text> : null}
        {chapter.summary ? <Text type="tertiary">摘要：{chapter.summary}</Text> : null}
        <Text type="tertiary">创建：{formatDate(chapter.createdAt)}</Text>
        <Text type="tertiary">更新：{formatDate(chapter.updatedAt)}</Text>
      </Space>
    </Card>
    <Card title="从场景装配正文" bodyStyle={{ padding: 16 }}>
      <Text type="tertiary" style={{ display: 'block', marginBottom: 12 }}>按当前章节下未删除 Scene 的 orderIndex 排序，读取每个 Scene.currentVersionId 对应正文并拼接为新的 ChapterVersion。</Text>
      <Space wrap spacing={16} style={{ marginBottom: 12 }}>
        <Checkbox checked={includeSceneTitles} onChange={(event) => setIncludeSceneTitles(Boolean(event.target.checked))}>包含场景标题</Checkbox>
        <Checkbox checked={assembleActivate} onChange={(event) => setAssembleActivate(Boolean(event.target.checked))}>装配后设为当前版本</Checkbox>
      </Space>
      <Space wrap>
        <Button theme="solid" type="primary" loading={assembling} onClick={onAssemble}>从场景装配</Button>
        <Text type={profile?.readiness.canAssembleFromScenes ? 'tertiary' : 'warning'}>场景数：{profile?.stats.sceneCount ?? 0}；{profile?.readiness.canAssembleFromScenes ? '可装配' : '存在缺少当前版本的场景'}</Text>
      </Space>
    </Card>
  </div>;
}

function BodyPanel({ content, setContent, changeSummary, setChangeSummary, saveAndActivate, setSaveAndActivate, saving, onSave, currentVersion }: {
  content: string;
  setContent: (value: string) => void;
  changeSummary: string;
  setChangeSummary: (value: string) => void;
  saveAndActivate: boolean;
  setSaveAndActivate: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
  currentVersion?: ChapterVersion | null;
}) {
  return <div style={{ display: 'grid', gap: 12 }}>
    <Space wrap spacing={8}>
      <Tag color="blue">字数 {countWords(content)}</Tag>
      {currentVersion ? <Text type="tertiary">当前版本：{shortId(currentVersion.id)} · {formatDate(currentVersion.updatedAt || currentVersion.createdAt)}</Text> : <Text type="tertiary">暂无当前正文，可直接编辑并保存为版本。</Text>}
    </Space>
    <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入读者最终看到的章节正文。不使用富文本；保存会创建新的 ChapterVersion。" style={{ width: '100%', minHeight: 360, resize: 'vertical', padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 10, color: 'var(--semi-color-text-0)', background: 'var(--semi-color-bg-0)', lineHeight: 1.7, fontSize: 14 }} />
    <input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="版本说明（可选）" style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid var(--semi-color-border)', borderRadius: 8, color: 'var(--semi-color-text-0)', background: 'var(--semi-color-bg-0)' }} />
    <Space style={{ justifyContent: 'space-between' }}>
      <Checkbox checked={saveAndActivate} onChange={(event) => setSaveAndActivate(Boolean(event.target.checked))}>保存后设为当前版本</Checkbox>
      <Button theme="solid" type="primary" loading={saving} onClick={onSave}>保存为新版本</Button>
    </Space>
  </div>;
}

function VersionsPanel({ versions, currentVersionId, onPreview, onActivate }: { versions: ChapterVersion[]; currentVersionId?: string | null; onPreview: (version: ChapterVersion) => void; onActivate: (version: ChapterVersion) => void }) {
  if (versions.length === 0) return <EmptyState title="暂无版本" description="在“正文”中保存，或从场景装配生成 ChapterVersion。" />;
  return <div style={{ display: 'grid', gap: 10 }}>
    {versions.map((version) => <article key={version.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 12, padding: 12, border: '1px solid var(--semi-color-border)', borderRadius: 12 }}>
      <div style={{ minWidth: 0 }}>
        <Space wrap spacing={8}>
          <Tag color={version.id === currentVersionId ? 'green' : undefined}>{version.id === currentVersionId ? '当前版本' : shortId(version.id)}</Tag>
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return <Empty title={title} description={description} image={<IllustrationNoContent style={{ width: 140, height: 140 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 140, height: 140 }} />} />;
}

function normalizeChapterInput(values: Record<string, unknown>, isCreate: boolean): ChapterInput {
  const input: ChapterInput = {
    title: normalizeString(values.title) ?? undefined,
    plannedTitle: normalizeString(values.plannedTitle),
    goal: normalizeString(values.goal),
    orderIndex: typeof values.orderIndex === 'number' ? values.orderIndex : undefined,
    status: normalizeString(values.status) ?? undefined,
  };
  if (!input.title) throw new Error('请填写章节标题');
  if (isCreate) {
    if (input.plannedTitle === null) delete input.plannedTitle;
    if (input.goal === null) delete input.goal;
  }
  if (input.orderIndex === undefined || input.orderIndex === null) delete input.orderIndex;
  return input;
}

function normalizeString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function shortId(value: string) {
  return value.slice(-6);
}

function tabLabel(tab: DetailTab) {
  if (tab === 'overview') return '概览';
  if (tab === 'body') return '正文';
  return '版本';
}

function countWords(content: string) {
  return content.replace(/\s+/g, '').length;
}

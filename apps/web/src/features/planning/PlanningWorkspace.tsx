import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Notification, Popconfirm, Select, SideSheet, Skeleton, Space, Switch, Tag, Typography } from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconDelete, IconEdit, IconPlus } from '@douyinfe/semi-icons';
import { useUnsavedChangesGuard } from '../../shared/hooks/useUnsavedChangesGuard';
import { readInitialNovelLocation, updateNovelLocation } from '../../shared/navigation/workspaceLocation';
import { StatusTag, statusLabel, statusOptions } from '../../shared/ui/StatusTag';
import { createChapterFromPlan, createChapterPlan, createVolume, deleteChapterPlan, deleteVolume, listChapterPlans, listVolumes, updateChapterPlan, updateVolume, confirmChapterPlan, archiveChapterPlan, restoreChapterPlan } from './api';
import type { ChapterPlan, ChapterPlanInput, Volume, VolumeInput } from './types';

const { Title, Text, Paragraph } = Typography;
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type EditingVolumeState = { mode: 'create' } | { mode: 'edit'; volume: Volume };
type EditingPlanState = { mode: 'create' } | { mode: 'edit'; plan: ChapterPlan };

const planStatusOptions = statusOptions(['planned', 'confirmed', 'archived'] as const);
const noVolumeId = '__NO_VOLUME__';

export function PlanningWorkspace({ projectId }: { projectId: string }) {
  const initialLocation = useMemo(() => readInitialNovelLocation(), []);
  const initialMatchesProject = initialLocation.projectId === projectId;
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [plans, setPlans] = useState<ChapterPlan[]>([]);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string>(() => initialMatchesProject ? initialLocation.volumeId ?? noVolumeId : noVolumeId);
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(() => initialMatchesProject ? initialLocation.planId : undefined);
  const [includeArchived, setIncludeArchived] = useState(() => initialMatchesProject ? initialLocation.includeArchived ?? false : false);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingVolume, setEditingVolume] = useState<EditingVolumeState>();
  const [editingPlan, setEditingPlan] = useState<EditingPlanState>();
  const [saving, setSaving] = useState(false);
  const [volumeFormApi, setVolumeFormApi] = useState<FormApi>();
  const [planFormApi, setPlanFormApi] = useState<FormApi>();
  const unsavedGuard = useUnsavedChangesGuard();

  const selectedVolume = useMemo(() => volumes.find((volume) => volume.id === selectedVolumeId), [selectedVolumeId, volumes]);
  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === selectedPlanId) ?? plans[0], [plans, selectedPlanId]);
  const nextVolumeOrderIndex = useMemo(() => volumes.reduce((max, volume) => Math.max(max, volume.orderIndex), -1) + 1, [volumes]);
  const nextPlanOrderIndex = useMemo(() => plans.reduce((max, plan) => Math.max(max, plan.orderIndex), -1) + 1, [plans]);

  const refreshVolumes = useCallback(async () => {
    try {
      const next = await listVolumes(projectId);
      setVolumes(next);
      setSelectedVolumeId((current) => current === noVolumeId || next.some((volume) => volume.id === current) ? current : noVolumeId);
    } catch (error) {
      setVolumes([]);
      Notification.error({ title: '分卷加载失败', content: String((error as Error).message ?? error) });
    }
  }, [projectId]);

  const refreshPlans = useCallback(async (preferredId?: string) => {
    setPlansLoading(true);
    try {
      const params = selectedVolumeId === noVolumeId ? { unassigned: true, includeArchived } : { volumeId: selectedVolumeId, includeArchived };
      const next = await listChapterPlans(projectId, params);
      setPlans(next);
      setSelectedPlanId((current) => preferredId ?? (current && next.some((plan) => plan.id === current) ? current : next[0]?.id));
    } catch (error) {
      setPlans([]);
      setSelectedPlanId(undefined);
      Notification.error({ title: '章节计划加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setPlansLoading(false);
    }
  }, [includeArchived, projectId, selectedVolumeId]);

  useEffect(() => {
    updateNovelLocation({
      app: 'shelf',
      view: 'workspace',
      projectId,
      section: 'planning',
      volumeId: selectedVolumeId,
      planId: selectedPlanId,
      includeArchived,
    });
  }, [includeArchived, projectId, selectedPlanId, selectedVolumeId]);

  useEffect(() => {
    setLoading(true);
    refreshVolumes().finally(() => setLoading(false));
  }, [refreshVolumes]);

  useEffect(() => {
    refreshPlans();
  }, [refreshPlans]);

  async function saveVolume() {
    if (!volumeFormApi || !editingVolume) return;
    setSaving(true);
    try {
      const values = await volumeFormApi.validate() as Record<string, unknown>;
      const input = normalizeVolumeInput(values, editingVolume.mode === 'create');
      const saved = editingVolume.mode === 'create'
        ? await createVolume(projectId, input)
        : await updateVolume(projectId, editingVolume.volume.id, input);
      Notification.success({ title: '分卷已保存' });
      unsavedGuard.resetDirty('volume');
      setEditingVolume(undefined);
      await refreshVolumes();
      setSelectedVolumeId(saved.id);
    } catch (error) {
      Notification.error({ title: '分卷保存失败', content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function savePlan() {
    if (!planFormApi || !editingPlan) return;
    setSaving(true);
    try {
      const values = await planFormApi.validate() as Record<string, unknown>;
      const input = normalizePlanInput(values, editingPlan.mode === 'create', selectedVolumeId === noVolumeId ? null : selectedVolumeId);
      const saved = editingPlan.mode === 'create'
        ? await createChapterPlan(projectId, input)
        : await updateChapterPlan(projectId, editingPlan.plan.id, input);
      Notification.success({ title: '章节计划已保存' });
      unsavedGuard.resetDirty('plan');
      setEditingPlan(undefined);
      await refreshPlans(saved.id);
    } catch (error) {
      Notification.error({ title: '章节计划保存失败', content: String((error as Error).message ?? error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVolume(volume: Volume) {
    try {
      await deleteVolume(projectId, volume.id);
      Notification.success({ title: '分卷已删除' });
      setSelectedVolumeId(noVolumeId);
      await refreshVolumes();
    } catch (error) {
      Notification.error({ title: '分卷删除失败', content: String((error as Error).message ?? error) });
    }
  }

  async function mutatePlan(plan: ChapterPlan, action: 'delete' | 'confirm' | 'archive' | 'restore' | 'createChapter') {
    try {
      if (action === 'delete') await deleteChapterPlan(projectId, plan.id);
      if (action === 'confirm') await confirmChapterPlan(projectId, plan.id);
      if (action === 'archive') await archiveChapterPlan(projectId, plan.id);
      if (action === 'restore') await restoreChapterPlan(projectId, plan.id);
      if (action === 'createChapter') await createChapterFromPlan(projectId, plan.id);
      Notification.success({ title: action === 'createChapter' ? '正式章节已创建' : '章节计划已更新' });
      await refreshPlans(action === 'delete' ? undefined : plan.id);
    } catch (error) {
      Notification.error({ title: '章节计划操作失败', content: String((error as Error).message ?? error) });
    }
  }

  return <div className="planning-workspace">
    <section className="app-page-hero">
      <div>
        <Title heading={3} style={{ margin: 0 }}>规划</Title>
        <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>按分卷/故事单元组织轻量章节计划；P1 不提供 AI 生成、复杂拖拽或时间线。</Text>
      </div>
      <Space className="app-page-actions">
        <Switch checked={includeArchived} onChange={setIncludeArchived} />
        <Text type="tertiary">显示归档计划</Text>
        <Button theme="solid" type="primary" icon={<IconPlus />} onClick={() => setEditingPlan({ mode: 'create' })}>新增章节计划</Button>
      </Space>
    </section>

    <div className="planning-workspace__grid">
      <Card className="planning-workspace__card" bodyStyle={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title heading={5} style={{ margin: 0 }}>分卷 / 故事单元</Title>
          <Button size="small" icon={<IconPlus />} theme="light" type="primary" onClick={() => setEditingVolume({ mode: 'create' })}>新增</Button>
        </div>
        {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={() => setSelectedVolumeId(noVolumeId)} style={volumeButtonStyle(selectedVolumeId === noVolumeId)}>
            <Text strong>未分卷计划</Text>
            <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>尚未归属到故事单元</Text>
          </button>
          {volumes.map((volume) => <div key={volume.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 6, alignItems: 'start' }}>
            <button type="button" onClick={() => setSelectedVolumeId(volume.id)} style={volumeButtonStyle(volume.id === selectedVolumeId)}>
              <Text strong ellipsis={{ showTooltip: true }}>{volume.title}</Text>
              <Space spacing={4} style={{ marginTop: 6 }}>
                <Tag size="small">#{volume.orderIndex}</Tag>
                {volume.status ? <StatusTag status={volume.status} /> : null}
              </Space>
              <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ display: 'block', marginTop: 6 }}>{volume.goal || volume.summary || '未填写目标'}</Text>
            </button>
            <Space vertical spacing={2}>
              <Button size="small" icon={<IconEdit />} theme="borderless" aria-label={`编辑分卷 ${volume.title}`} onClick={() => setEditingVolume({ mode: 'edit', volume })} />
              <Popconfirm title="确认删除这个分卷？" content="分卷会被软删除，已有章节计划会保留其历史关联。" onConfirm={() => handleDeleteVolume(volume)}><Button size="small" icon={<IconDelete />} type="danger" theme="borderless" aria-label={`删除分卷 ${volume.title}`} /></Popconfirm>
            </Space>
          </div>)}
        </div>}
      </Card>

      <Card className="planning-workspace__card" bodyStyle={{ padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div>
            <Title heading={5} style={{ margin: 0 }}>章节计划</Title>
            <Text type="tertiary" size="small">{selectedVolume ? selectedVolume.title : '未分卷'} · {plans.length} 条</Text>
          </div>
          <Button size="small" icon={<IconPlus />} theme="light" type="primary" onClick={() => setEditingPlan({ mode: 'create' })}>新增</Button>
        </div>
        {plansLoading ? <Skeleton placeholder={<Skeleton.Paragraph rows={7} />} loading /> : plans.length === 0 ? <EmptyState title="暂无章节计划" description="点击新增章节计划，先记录章节目标和大纲。" /> : <div style={{ display: 'grid', gap: 10 }}>
          {plans.map((plan) => <button key={plan.id} type="button" onClick={() => setSelectedPlanId(plan.id)} style={{ textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${plan.id === selectedPlan?.id ? 'var(--semi-color-primary-light-active)' : 'var(--semi-color-border)'}`, background: plan.id === selectedPlan?.id ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', cursor: 'pointer' }}>
            <Space wrap spacing={6} style={{ rowGap: 6 }}>
              <Text strong>{plan.title || `计划 #${plan.orderIndex}`}</Text>
              <Tag size="small">#{plan.orderIndex}</Tag>
              <StatusTag status={plan.status} label={statusLabel(plan.status, '')} />
              <StatusTag status={plan.canonStatus} label={statusLabel(plan.canonStatus, '')} />
              {plan.chapterId ? <Tag color="green">已建章节</Tag> : null}
            </Space>
            <Paragraph type={plan.goal || plan.outline ? undefined : 'tertiary'} ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{plan.goal || plan.outline || '未填写计划目标'}</Paragraph>
          </button>)}
        </div>}
      </Card>

      <Card className="planning-workspace__card" bodyStyle={{ padding: 20 }}>
        {!selectedPlan ? <EmptyState title="未选择章节计划" description="从中间列表选择一条计划，或新增计划。" /> : <PlanDetail plan={selectedPlan} volume={volumes.find((volume) => volume.id === selectedPlan.volumeId)} onEdit={() => setEditingPlan({ mode: 'edit', plan: selectedPlan })} onAction={(action) => mutatePlan(selectedPlan, action)} />}
      </Card>
    </div>

    <SideSheet title={editingVolume?.mode === 'create' ? '新增分卷/故事单元' : '编辑分卷/故事单元'} visible={Boolean(editingVolume)} onCancel={() => unsavedGuard.guard('volume', () => setEditingVolume(undefined))} width={520} footer={<SheetFooter onCancel={() => unsavedGuard.guard('volume', () => setEditingVolume(undefined))} onSave={saveVolume} saving={saving} />}>
      {editingVolume ? <Form key={editingVolume.mode === 'create' ? 'new-volume' : editingVolume.volume.id} initValues={editingVolume.mode === 'create' ? { orderIndex: nextVolumeOrderIndex, status: 'planned' } : editingVolume.volume} getFormApi={setVolumeFormApi} labelPosition="top" onValueChange={() => unsavedGuard.markDirty('volume')}>
        <Form.Input field="title" label="分卷/故事单元名" rules={[{ required: true, message: '请填写名称' }]} />
        <Form.TextArea field="goal" label="目标" autosize={{ minRows: 3, maxRows: 6 }} />
        <Form.TextArea field="summary" label="简介" autosize={{ minRows: 3, maxRows: 6 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <Form.InputNumber field="orderIndex" label="排序" style={{ width: '100%' }} />
          <Form.Input field="status" label="状态" />
        </div>
      </Form> : null}
    </SideSheet>

    <SideSheet title={editingPlan?.mode === 'create' ? '新增章节计划' : '编辑章节计划'} visible={Boolean(editingPlan)} onCancel={() => unsavedGuard.guard('plan', () => setEditingPlan(undefined))} width={640} footer={<SheetFooter onCancel={() => unsavedGuard.guard('plan', () => setEditingPlan(undefined))} onSave={savePlan} saving={saving} />}>
      {editingPlan ? <Form key={editingPlan.mode === 'create' ? `new-plan:${selectedVolumeId}` : editingPlan.plan.id} initValues={editingPlan.mode === 'create' ? { volumeId: selectedVolumeId === noVolumeId ? undefined : selectedVolumeId, status: 'planned', orderIndex: nextPlanOrderIndex } : formPlanValues(editingPlan.plan)} getFormApi={setPlanFormApi} labelPosition="top" onValueChange={() => unsavedGuard.markDirty('plan')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <Form.Input field="title" label="计划标题" />
          <Form.Select field="volumeId" label="所属分卷" showClear placeholder="未分卷" style={{ width: '100%' }}>{volumes.map((volume) => <Select.Option key={volume.id} value={volume.id}>{volume.title}</Select.Option>)}</Form.Select>
        </div>
        <Form.TextArea field="goal" label="章节目标" autosize={{ minRows: 3, maxRows: 6 }} />
        <Form.TextArea field="outline" label="章节大纲" autosize={{ minRows: 4, maxRows: 10 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 16 }}>
          <Form.Input field="pov" label="POV / 视角" />
          <Form.InputNumber field="orderIndex" label="排序" style={{ width: '100%' }} />
          <Form.Select field="status" label="状态" style={{ width: '100%' }}>{planStatusOptions.map((option) => <Select.Option key={option.value} value={option.value}>{option.label}</Select.Option>)}</Form.Select>
        </div>
        <Form.TextArea field="constraints" label="约束/备注" extraText="可写分点、简短说明或 JSON；留空会清空。" autosize={{ minRows: 3, maxRows: 8 }} />
      </Form> : null}
    </SideSheet>
  </div>;
}

function PlanDetail({ plan, volume, onEdit, onAction }: { plan: ChapterPlan; volume?: Volume; onEdit: () => void; onAction: (action: 'delete' | 'confirm' | 'archive' | 'restore' | 'createChapter') => void }) {
  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', marginBottom: 16 }}>
      <div>
        <Title heading={4} style={{ margin: 0 }}>{plan.title || `章节计划 #${plan.orderIndex}`}</Title>
        <Space wrap spacing={6} style={{ marginTop: 8, rowGap: 6 }}>
          <Tag>#{plan.orderIndex}</Tag>
          <StatusTag status={plan.status} label={statusLabel(plan.status, '')} />
          <StatusTag status={plan.canonStatus} label={statusLabel(plan.canonStatus, '')} />
          {volume ? <Tag color="blue">{volume.title}</Tag> : <Tag>未分卷</Tag>}
          {plan.chapterId ? <Tag color="green">已创建正式章节</Tag> : null}
        </Space>
      </div>
      <Space wrap>
        <Button icon={<IconEdit />} onClick={onEdit}>编辑</Button>
        <Button theme="light" type="primary" onClick={() => onAction('confirm')} disabled={plan.canonStatus === 'confirmed'}>确认</Button>
        {plan.status === 'archived' || plan.canonStatus === 'archived' ? <Button onClick={() => onAction('restore')}>恢复</Button> : <Button onClick={() => onAction('archive')}>归档</Button>}
        <Button theme="solid" type="primary" onClick={() => onAction('createChapter')} disabled={Boolean(plan.chapterId) || plan.status === 'archived'}>创建正式章节</Button>
        <Popconfirm title="确认删除这个章节计划？" content="会软删除并归档该计划。" onConfirm={() => onAction('delete')}><Button icon={<IconDelete />} type="danger" theme="borderless">删除</Button></Popconfirm>
      </Space>
    </div>
    <div style={{ display: 'grid', gap: 14 }}>
      <InfoBlock label="章节目标" value={plan.goal} />
      <InfoBlock label="章节大纲" value={plan.outline} />
      <InfoBlock label="POV / 视角" value={plan.pov} />
      <InfoBlock label="约束/备注" value={displayValue(plan.constraints)} />
      <InfoBlock label="来源" value={[plan.sourceType, plan.sourceId].filter(Boolean).join(' · ')} />
      <Text type="tertiary" size="small">更新：{formatDate(plan.updatedAt)}</Text>
    </div>
  </div>;
}

function InfoBlock({ label, value }: { label: string; value: unknown }) {
  return <section style={{ padding: 14, border: '1px solid var(--semi-color-border)', borderRadius: 12, background: 'var(--semi-color-fill-0)' }}>
    <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 6 }}>{label}</Text>
    <Paragraph type={value ? undefined : 'tertiary'} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{displayValue(value) || '未填写'}</Paragraph>
  </section>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <Empty title={title} description={description} image={<IllustrationNoContent style={{ width: 112, height: 112 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 112, height: 112 }} />} />;
}

function SheetFooter({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={onCancel}>取消</Button><Button theme="solid" type="primary" loading={saving} onClick={onSave}>保存</Button></div>;
}

function volumeButtonStyle(active: boolean): React.CSSProperties {
  return { width: '100%', textAlign: 'left', padding: 12, borderRadius: 10, border: `1px solid ${active ? 'var(--semi-color-primary-light-active)' : 'var(--semi-color-border)'}`, background: active ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-bg-0)', cursor: 'pointer' };
}

function normalizeVolumeInput(values: Record<string, unknown>, isCreate: boolean): VolumeInput {
  const input: VolumeInput = {
    title: normalizeString(values.title) ?? undefined,
    summary: normalizeString(values.summary),
    goal: normalizeString(values.goal),
    status: normalizeString(values.status),
    orderIndex: typeof values.orderIndex === 'number' ? values.orderIndex : undefined,
  };
  if (!input.title) throw new Error('请填写分卷/故事单元名');
  if (isCreate) {
    if (input.summary === null) delete input.summary;
    if (input.goal === null) delete input.goal;
    if (input.status === null) delete input.status;
  }
  if (input.orderIndex === undefined) delete input.orderIndex;
  return input;
}

function normalizePlanInput(values: Record<string, unknown>, isCreate: boolean, fallbackVolumeId: string | null): ChapterPlanInput {
  const volumeId = normalizeString(values.volumeId) ?? fallbackVolumeId;
  const input: ChapterPlanInput = {
    volumeId,
    title: normalizeString(values.title),
    goal: normalizeString(values.goal),
    outline: normalizeString(values.outline),
    pov: normalizeString(values.pov),
    constraints: parseStructuredField(values.constraints),
    orderIndex: typeof values.orderIndex === 'number' ? values.orderIndex : undefined,
    status: normalizeString(values.status) ?? undefined,
  };
  if (isCreate) {
    for (const key of ['title', 'goal', 'outline', 'pov', 'constraints'] as const) {
      if (input[key] === null) delete input[key];
    }
    if (input.volumeId === null) delete input.volumeId;
  }
  if (input.orderIndex === undefined) delete input.orderIndex;
  return input;
}

function formPlanValues(plan: ChapterPlan) {
  return { ...plan, constraints: displayValue(plan.constraints) };
}

function normalizeString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
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

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join('、');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function formatDate(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

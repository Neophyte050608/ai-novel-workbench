import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Form, Notification, Popconfirm, Select, SideSheet, Skeleton, Space, Tag, Typography } from '@douyinfe/semi-ui';
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { IconDelete, IconEdit, IconPlus } from '@douyinfe/semi-icons';
import { StatusTag, statusOptions } from '../../shared/ui/StatusTag';
import { createChapter, deleteChapter, listChapters, updateChapter } from './api';
import type { Chapter, ChapterInput } from './types';

const { Title, Text, Paragraph } = Typography;
type FormApi = Parameters<NonNullable<React.ComponentProps<typeof Form>['getFormApi']>>[0];
type EditingChapterState = { mode: 'create' } | { mode: 'edit'; chapter: Chapter };

const chapterStatusOptions = statusOptions(['draft', 'generating', 'reviewing', 'done', 'archived'] as const);

export function ChapterWorkspace({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingChapter, setEditingChapter] = useState<EditingChapterState>();
  const [saving, setSaving] = useState(false);
  const [formApi, setFormApi] = useState<FormApi>();

  const nextOrderIndex = useMemo(() => chapters.reduce((max, chapter) => Math.max(max, chapter.orderIndex), -1) + 1, [chapters]);

  const refreshChapters = useCallback(async () => {
    setLoading(true);
    try {
      setChapters(await listChapters(projectId));
    } catch (error) {
      setChapters([]);
      Notification.error({ title: '章节加载失败', content: String((error as Error).message ?? error) });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshChapters();
  }, [refreshChapters]);

  async function saveChapter() {
    if (!formApi || !editingChapter) return;
    setSaving(true);
    try {
      const values = await formApi.validate() as Record<string, unknown>;
      const input = normalizeChapterInput(values, editingChapter.mode === 'create');
        const visibleInput = Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'volumeId')) as ChapterInput;
        await (editingChapter.mode === 'create'
          ? createChapter(projectId, visibleInput)
          : updateChapter(projectId, editingChapter.chapter.id, visibleInput));
      Notification.success({ title: '章节已保存' });
      setEditingChapter(undefined);
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
      await refreshChapters();
    } catch (error) {
      Notification.error({ title: '章节删除失败', content: String((error as Error).message ?? error) });
    }
  }

  return <div>
    <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, marginBottom: 16 }}>
      <div>
        <Title heading={3} style={{ margin: 0 }}>章节</Title>
        <Text type="tertiary" style={{ display: 'block', marginTop: 6 }}>维护章节标题、目标、状态与排序；正文版本和 AI 生成不在此处提供。</Text>
      </div>
      <Space>
        <Button theme="solid" type="primary" icon={<IconPlus />} onClick={() => setEditingChapter({ mode: 'create' })}>新增章节</Button>
      </Space>
    </section>

    <Card style={{ borderRadius: 12, minHeight: 520 }} bodyStyle={{ padding: 16 }}>
      {loading ? <Skeleton placeholder={<Skeleton.Paragraph rows={8} />} loading /> : chapters.length === 0 ? <Empty title="暂无章节" description="先创建章节，再到场景工作台为章节编排场景。" image={<IllustrationNoContent style={{ width: 140, height: 140 }} />} darkModeImage={<IllustrationNoContentDark style={{ width: 140, height: 140 }} />} /> : <div style={{ display: 'grid', gap: 12 }}>
        {chapters.map((chapter) => <article key={chapter.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16, alignItems: 'start', padding: 14, border: '1px solid var(--semi-color-border)', borderRadius: 12, background: 'var(--semi-color-bg-0)' }}>
          <div style={{ minWidth: 0 }}>
            <Space wrap spacing={6} style={{ rowGap: 6 }}>
              <Title heading={5} style={{ margin: 0 }}>{chapter.title}</Title>
              <Tag size="small">#{chapter.orderIndex}</Tag>
              <StatusTag status={chapter.status} />
            </Space>
            <Paragraph type={chapter.goal ? undefined : 'tertiary'} ellipsis={{ rows: 2, showTooltip: true }} style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{chapter.goal || '未填写章节目标'}</Paragraph>
            <Space wrap spacing={8} style={{ marginTop: 8 }}>
              {chapter.plannedTitle ? <Text type="tertiary" size="small">计划标题：{chapter.plannedTitle}</Text> : null}
              {chapter.volumeId ? <Text type="tertiary" size="small">所属分卷：已关联</Text> : null}
              <Text type="tertiary" size="small">更新：{formatDate(chapter.updatedAt)}</Text>
            </Space>
          </div>
          <Space>
            <Button icon={<IconEdit />} onClick={() => setEditingChapter({ mode: 'edit', chapter })}>编辑</Button>
            <Popconfirm title="确认删除这个章节？" content="章节会被软删除，并从当前列表移除。" onConfirm={() => handleDeleteChapter(chapter)}><Button icon={<IconDelete />} type="danger" theme="borderless">删除</Button></Popconfirm>
          </Space>
        </article>)}
      </div>}
    </Card>

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

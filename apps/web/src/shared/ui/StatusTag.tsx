import type React from 'react';
import { Tag } from '@douyinfe/semi-ui';

export type StatusColor = React.ComponentProps<typeof Tag>['color'];

const statusLabels: Record<string, string> = {
  planning: '筹备中',
  active: '进行中',
  paused: '已暂停',
  completed: '已完成',
  draft: '草稿',
  planned: '计划中',
  generating: '生成中',
  writing: '撰写中',
  reviewing: '审阅中',
  done: '已完成',
  confirmed: '已确认',
  ready: '就绪',
  warning: '需注意',
  'not ready': '未就绪',
  error: '错误',
  risk: '风险',
  failed: '失败',
  archived: '已归档',
  disabled: '已禁用',
  public: '公开',
  private: '私密',
  hidden: '隐藏',
  canonical: '正典',
  candidate: '候选',
  deprecated: '弃用',
  user: '手动记录',
  imported: '导入内容',
  ai: '智能辅助',
  current: '当前有效',
  inactive: '未启用',
  unknown: '未知',
  alive: '存活',
  dead: '死亡',
  missing: '失踪',
  common: '常见',
  rare: '稀有',
  unique: '唯一',
};

export function statusLabel(status?: string | null, fallback = '未填写') {
  if (!status) return fallback;
  const normalized = String(status).trim().toLowerCase();
  return statusLabels[normalized] ?? String(status);
}

export function statusOptions<T extends string>(values: readonly T[]) {
  return values.map((value) => ({ value, label: statusLabel(value, value) }));
}

export function statusColor(status?: string | null): StatusColor {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (['confirmed', 'canonical', 'done', 'ready', 'completed', 'active', 'public', 'user', 'current', 'alive', '已确认', '正典', '已完成', '就绪', '进行中', '公开', '手动记录', '当前有效', '存活'].includes(normalized)) return 'green';
  if (['draft', 'planned', 'planning', 'writing', 'reviewing', 'generating', 'candidate', 'imported', 'ai', 'common', '草稿', '计划中', '筹备中', '撰写中', '审阅中', '生成中', '候选', '导入内容', '智能辅助', '常见'].includes(normalized)) return 'blue';
  if (['warning', 'not ready', 'paused', 'risk', 'rare', 'missing', '缺失', '未就绪', '需注意', '已暂停', '风险', '稀有', '失踪'].includes(normalized)) return 'orange';
  if (['error', 'failed', 'dead', '错误', '失败', '死亡'].includes(normalized)) return 'red';
  if (['archived', 'disabled', 'hidden', 'private', 'deprecated', 'inactive', 'unknown', '已归档', '已禁用', '隐藏', '私密', '弃用', '未启用', '未知'].includes(normalized)) return 'grey';
  return undefined;
}

export function StatusTag({ status, label, size = 'small' }: { status?: string | null; label?: string; size?: React.ComponentProps<typeof Tag>['size'] }) {
  return <Tag size={size} color={statusColor(status)}>{label ?? statusLabel(status)}</Tag>;
}

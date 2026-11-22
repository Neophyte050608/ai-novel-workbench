import { apiDelete, apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type { Chapter } from '../chapters/types';
import type { ChapterPlan, ChapterPlanInput, Volume, VolumeInput } from './types';

export function listVolumes(projectId: string) {
  return apiGet<Volume[]>(`/projects/${projectId}/volumes`);
}

export function createVolume(projectId: string, input: VolumeInput) {
  return apiPost<Volume>(`/projects/${projectId}/volumes`, input);
}

export function updateVolume(projectId: string, volumeId: string, input: VolumeInput) {
  return apiPatch<Volume>(`/projects/${projectId}/volumes/${volumeId}`, input);
}

export function deleteVolume(projectId: string, volumeId: string) {
  return apiDelete<Volume>(`/projects/${projectId}/volumes/${volumeId}`);
}

export function reorderVolumes(projectId: string, volumeIds: string[]) {
  return apiPost<Volume[]>(`/projects/${projectId}/volumes/reorder`, { volumeIds });
}

export function listChapterPlans(projectId: string, params: { volumeId?: string; includeArchived?: boolean; unassigned?: boolean } = {}) {
  const search = new URLSearchParams();
  if (params.unassigned) search.set('unassigned', 'true');
  else if (params.volumeId) search.set('volumeId', params.volumeId);
  if (params.includeArchived) search.set('includeArchived', 'true');
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return apiGet<ChapterPlan[]>(`/projects/${projectId}/chapter-plans${suffix}`);
}

export function createChapterPlan(projectId: string, input: ChapterPlanInput) {
  return apiPost<ChapterPlan>(`/projects/${projectId}/chapter-plans`, input);
}

export function updateChapterPlan(projectId: string, planId: string, input: ChapterPlanInput) {
  return apiPatch<ChapterPlan>(`/projects/${projectId}/chapter-plans/${planId}`, input);
}

export function deleteChapterPlan(projectId: string, planId: string) {
  return apiDelete<ChapterPlan>(`/projects/${projectId}/chapter-plans/${planId}`);
}

export function confirmChapterPlan(projectId: string, planId: string) {
  return apiPost<ChapterPlan>(`/projects/${projectId}/chapter-plans/${planId}/confirm`, {});
}

export function archiveChapterPlan(projectId: string, planId: string) {
  return apiPost<ChapterPlan>(`/projects/${projectId}/chapter-plans/${planId}/archive`, {});
}

export function restoreChapterPlan(projectId: string, planId: string) {
  return apiPost<ChapterPlan>(`/projects/${projectId}/chapter-plans/${planId}/restore`, {});
}

export function createChapterFromPlan(projectId: string, planId: string) {
  return apiPost<Chapter>(`/projects/${projectId}/chapter-plans/${planId}/create-chapter`, {});
}

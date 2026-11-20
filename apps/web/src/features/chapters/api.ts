import { apiDelete, apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type { Chapter, ChapterInput } from './types';

export function listChapters(projectId: string) {
  return apiGet<Chapter[]>(`/projects/${projectId}/chapters`);
}

export function createChapter(projectId: string, input: ChapterInput) {
  return apiPost<Chapter>(`/projects/${projectId}/chapters`, input);
}

export function getChapter(projectId: string, chapterId: string) {
  return apiGet<Chapter>(`/projects/${projectId}/chapters/${chapterId}`);
}

export function updateChapter(projectId: string, chapterId: string, input: ChapterInput) {
  return apiPatch<Chapter>(`/projects/${projectId}/chapters/${chapterId}`, input);
}

export function deleteChapter(projectId: string, chapterId: string) {
  return apiDelete<Chapter>(`/projects/${projectId}/chapters/${chapterId}`);
}

export function reorderChapters(projectId: string, chapterIds: string[]) {
  return apiPost<Chapter[]>(`/projects/${projectId}/chapters/reorder`, { chapterIds });
}

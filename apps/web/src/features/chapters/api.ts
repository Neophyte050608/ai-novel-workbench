import { apiDelete, apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type { AssembleChapterInput, Chapter, ChapterInput, ChapterProfile, ChapterVersion, ChapterVersionInput } from './types';

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

export function listChapterVersions(projectId: string, chapterId: string) {
  return apiGet<ChapterVersion[]>(`/projects/${projectId}/chapters/${chapterId}/versions`);
}

export function createChapterVersion(projectId: string, chapterId: string, input: ChapterVersionInput) {
  return apiPost<ChapterVersion>(`/projects/${projectId}/chapters/${chapterId}/versions`, input);
}

export function getChapterVersion(projectId: string, versionId: string) {
  return apiGet<ChapterVersion>(`/projects/${projectId}/chapter-versions/${versionId}`);
}

export function updateChapterVersion(projectId: string, versionId: string, input: ChapterVersionInput) {
  return apiPatch<ChapterVersion>(`/projects/${projectId}/chapter-versions/${versionId}`, input);
}

export function activateChapterVersion(projectId: string, chapterId: string, versionId: string) {
  return apiPost<Chapter>(`/projects/${projectId}/chapters/${chapterId}/versions/${versionId}/activate`, {});
}

export function assembleChapterFromScenes(projectId: string, chapterId: string, input: AssembleChapterInput) {
  return apiPost<ChapterVersion>(`/projects/${projectId}/chapters/${chapterId}/assemble-from-scenes`, input);
}

export function getChapterProfile(projectId: string, chapterId: string) {
  return apiGet<ChapterProfile>(`/projects/${projectId}/chapters/${chapterId}/profile`);
}

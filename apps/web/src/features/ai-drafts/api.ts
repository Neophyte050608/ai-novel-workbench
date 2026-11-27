import { apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type { AiDraftListQuery, ApplyAiDraftInput, CreateAiDraftInput, GeneratedDraft, RegenerateAiDraftInput, UpdateAiDraftInput } from './types';

function buildQuery(query: AiDraftListQuery = {}) {
  const params = new URLSearchParams();
  if (query.targetType) params.set('targetType', query.targetType);
  if (query.targetId) params.set('targetId', query.targetId);
  if (query.status) params.set('status', query.status);
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function listAiDrafts(projectId: string, query: AiDraftListQuery = {}) {
  return apiGet<GeneratedDraft[]>(`/projects/${projectId}/ai-drafts${buildQuery(query)}`);
}

export function createAiDraft(projectId: string, input: CreateAiDraftInput) {
  return apiPost<GeneratedDraft>(`/projects/${projectId}/ai-drafts`, input);
}

export function getAiDraft(projectId: string, draftId: string) {
  return apiGet<GeneratedDraft>(`/projects/${projectId}/ai-drafts/${draftId}`);
}

export function updateAiDraft(projectId: string, draftId: string, input: UpdateAiDraftInput) {
  return apiPatch<GeneratedDraft>(`/projects/${projectId}/ai-drafts/${draftId}`, input);
}

export function discardAiDraft(projectId: string, draftId: string) {
  return apiPost<GeneratedDraft>(`/projects/${projectId}/ai-drafts/${draftId}/discard`, {});
}

export function applyAiDraft(projectId: string, draftId: string, input: ApplyAiDraftInput = {}) {
  return apiPost<GeneratedDraft>(`/projects/${projectId}/ai-drafts/${draftId}/apply`, input);
}

export function regenerateAiDraft(projectId: string, draftId: string, input: RegenerateAiDraftInput = {}) {
  return apiPost<GeneratedDraft>(`/projects/${projectId}/ai-drafts/${draftId}/regenerate`, input);
}

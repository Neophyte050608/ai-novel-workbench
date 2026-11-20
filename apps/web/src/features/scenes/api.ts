import { apiDelete, apiGet, apiPatch, apiPost } from '../../shared/api/client';
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

export function listScenes(projectId: string, chapterId: string) {
  return apiGet<Scene[]>(`/projects/${projectId}/chapters/${chapterId}/scenes`);
}

export function createScene(projectId: string, chapterId: string, input: SceneInput) {
  return apiPost<Scene>(`/projects/${projectId}/chapters/${chapterId}/scenes`, input);
}

export function reorderScenes(projectId: string, chapterId: string, sceneIds: string[]) {
  return apiPost<Scene[]>(`/projects/${projectId}/chapters/${chapterId}/scenes/reorder`, { sceneIds });
}

export function getScene(projectId: string, sceneId: string) {
  return apiGet<Scene>(`/projects/${projectId}/scenes/${sceneId}`);
}

export const getSceneDetail = getScene;

export function updateScene(projectId: string, sceneId: string, input: SceneInput) {
  return apiPatch<Scene>(`/projects/${projectId}/scenes/${sceneId}`, input);
}

export function confirmScene(projectId: string, sceneId: string) {
  return apiPost<Scene>(`/projects/${projectId}/scenes/${sceneId}/confirm`, {});
}

export function archiveScene(projectId: string, sceneId: string) {
  return apiPost<Scene>(`/projects/${projectId}/scenes/${sceneId}/archive`, {});
}

export function restoreScene(projectId: string, sceneId: string) {
  return apiPost<Scene>(`/projects/${projectId}/scenes/${sceneId}/restore`, {});
}

export function deleteScene(projectId: string, sceneId: string) {
  return apiDelete<Scene>(`/projects/${projectId}/scenes/${sceneId}`);
}

export function getSceneProfile(projectId: string, sceneId: string) {
  return apiGet<SceneProfile>(`/projects/${projectId}/scenes/${sceneId}/profile`);
}

export function listScenePlans(projectId: string, sceneId: string) {
  return apiGet<ScenePlan[]>(`/projects/${projectId}/scenes/${sceneId}/plans`);
}

export function createScenePlan(projectId: string, sceneId: string, input: ScenePlanInput) {
  return apiPost<ScenePlan>(`/projects/${projectId}/scenes/${sceneId}/plans`, input);
}

export function getScenePlan(projectId: string, planId: string) {
  return apiGet<ScenePlan>(`/projects/${projectId}/scene-plans/${planId}`);
}

export const getScenePlanDetail = getScenePlan;

export function updateScenePlan(projectId: string, planId: string, input: ScenePlanInput) {
  return apiPatch<ScenePlan>(`/projects/${projectId}/scene-plans/${planId}`, input);
}

export function deleteScenePlan(projectId: string, planId: string) {
  return apiDelete<ScenePlan>(`/projects/${projectId}/scene-plans/${planId}`);
}

export function activateScenePlan(projectId: string, sceneId: string, planId: string) {
  return apiPost<Scene>(`/projects/${projectId}/scenes/${sceneId}/plans/${planId}/activate`, {});
}

export function listSceneVersions(projectId: string, sceneId: string) {
  return apiGet<SceneVersion[]>(`/projects/${projectId}/scenes/${sceneId}/versions`);
}

export function createSceneVersion(projectId: string, sceneId: string, input: SceneVersionInput) {
  return apiPost<SceneVersion>(`/projects/${projectId}/scenes/${sceneId}/versions`, input);
}

export function getSceneVersion(projectId: string, versionId: string) {
  return apiGet<SceneVersion>(`/projects/${projectId}/scene-versions/${versionId}`);
}

export const getSceneVersionDetail = getSceneVersion;

export function updateSceneVersion(projectId: string, versionId: string, input: SceneVersionInput) {
  return apiPatch<SceneVersion>(`/projects/${projectId}/scene-versions/${versionId}`, input);
}

export function deleteSceneVersion(projectId: string, versionId: string) {
  return apiDelete<SceneVersion>(`/projects/${projectId}/scene-versions/${versionId}`);
}

export function activateSceneVersion(projectId: string, sceneId: string, versionId: string) {
  return apiPost<Scene>(`/projects/${projectId}/scenes/${sceneId}/versions/${versionId}/activate`, {});
}

export function listSceneSummaries(projectId: string, sceneId: string) {
  return apiGet<SceneSummary[]>(`/projects/${projectId}/scenes/${sceneId}/summaries`);
}

export function createSceneSummary(projectId: string, sceneId: string, input: SceneSummaryInput) {
  return apiPost<SceneSummary>(`/projects/${projectId}/scenes/${sceneId}/summaries`, input);
}

export function getSceneSummary(projectId: string, summaryId: string) {
  return apiGet<SceneSummary>(`/projects/${projectId}/scene-summaries/${summaryId}`);
}

export const getSceneSummaryDetail = getSceneSummary;

export function updateSceneSummary(projectId: string, summaryId: string, input: SceneSummaryInput) {
  return apiPatch<SceneSummary>(`/projects/${projectId}/scene-summaries/${summaryId}`, input);
}

export function deleteSceneSummary(projectId: string, summaryId: string) {
  return apiDelete<SceneSummary>(`/projects/${projectId}/scene-summaries/${summaryId}`);
}

export function listSceneHandoffs(projectId: string, sceneId: string) {
  return apiGet<SceneHandoff[]>(`/projects/${projectId}/scenes/${sceneId}/handoffs`);
}

export function createSceneHandoff(projectId: string, sceneId: string, input: SceneHandoffInput) {
  return apiPost<SceneHandoff>(`/projects/${projectId}/scenes/${sceneId}/handoffs`, input);
}

export function getSceneHandoff(projectId: string, handoffId: string) {
  return apiGet<SceneHandoff>(`/projects/${projectId}/scene-handoffs/${handoffId}`);
}

export const getSceneHandoffDetail = getSceneHandoff;

export function updateSceneHandoff(projectId: string, handoffId: string, input: SceneHandoffInput) {
  return apiPatch<SceneHandoff>(`/projects/${projectId}/scene-handoffs/${handoffId}`, input);
}

export function deleteSceneHandoff(projectId: string, handoffId: string) {
  return apiDelete<SceneHandoff>(`/projects/${projectId}/scene-handoffs/${handoffId}`);
}

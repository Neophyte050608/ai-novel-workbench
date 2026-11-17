import { apiGet, apiPatch, apiPost } from '../../shared/api/client';
import type {
  LlmProvider,
  MagpieDiscoverResult,
  MagpieModelsResult,
  SaveLlmProviderInput,
  TestConnectionResult,
} from './types';

export function listLlmProviders() {
  return apiGet<LlmProvider[]>('/llm-providers');
}

export function discoverMagpie() {
  return apiGet<MagpieDiscoverResult>('/llm-providers/magpie/discover');
}

export function listMagpieModels(input: { baseUrl?: string; gatewayKey?: string }) {
  return apiPost<MagpieModelsResult>('/llm-providers/magpie/models', input);
}

export function testMagpieConnection(input: { baseUrl?: string; gatewayKey?: string; model: string }) {
  return apiPost<TestConnectionResult>('/llm-providers/magpie/test', input);
}

export function createLlmProvider(input: SaveLlmProviderInput) {
  return apiPost<LlmProvider>('/llm-providers', { ...input, type: 'magpie', name: input.name ?? 'Magpie' });
}

export function updateLlmProvider(id: string, input: Partial<SaveLlmProviderInput> & { clearGatewayKey?: boolean }) {
  return apiPatch<LlmProvider>(`/llm-providers/${id}`, input);
}

export function testSavedProvider(id: string) {
  return apiPost<TestConnectionResult>(`/llm-providers/${id}/test`, {});
}

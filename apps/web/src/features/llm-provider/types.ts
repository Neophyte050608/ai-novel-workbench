export interface LlmProviderConfig {
  timeoutMs?: number;
  maxRetries?: number;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export interface LlmProvider {
  id: string;
  projectId?: string | null;
  name: string;
  type: 'magpie' | 'mock';
  baseUrl?: string | null;
  model: string;
  config?: LlmProviderConfig | null;
  isDefault: boolean;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  hasGatewayKey: boolean;
}

export interface MagpieDiscoverResult {
  found: boolean;
  baseUrl?: string;
  version?: string;
  message: string;
}

export interface MagpieModelItem {
  id: string;
  object?: string;
  ownedBy?: string;
}

export interface MagpieModelsResult {
  baseUrl: string;
  models: MagpieModelItem[];
  count: number;
}

export interface TestConnectionResult {
  ok: boolean;
  providerId: string;
  model: string;
  latencyMs: number;
  message: string;
  error?: {
    code?: string;
    message: string;
    retryable?: boolean;
    statusCode?: number;
  };
}

export interface SaveLlmProviderInput {
  name?: string;
  type?: 'magpie';
  baseUrl: string;
  model: string;
  gatewayKey?: string;
  config?: LlmProviderConfig;
  isDefault?: boolean;
  isEnabled?: boolean;
}

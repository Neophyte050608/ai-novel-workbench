import { LLMProviderType } from '@prisma/client';

export type LlmProviderType = LLMProviderType;

export type LlmMessageRole = 'system' | 'user' | 'assistant';

export type LlmMessage = {
  role: LlmMessageRole;
  content: string;
};

export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

export type ResolvedLlmProvider = {
  id: string;
  type: LlmProviderType;
  name: string;
  baseUrl?: string | null;
  model: string;
  gatewayKey?: string | null;
  config?: unknown;
};

export type GenerateTextInput = {
  provider: ResolvedLlmProvider;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  abortSignal?: AbortSignal;
  metadata?: {
    projectId?: string;
    taskId?: string;
    purpose?: string;
  };
};

export type StreamTextInput = GenerateTextInput;

export type GenerateTextResult = {
  text: string;
  finishReason?: string;
  tokenUsage?: TokenUsage;
  raw?: unknown;
};

export type LlmProviderErrorCode =
  | 'MISSING_GATEWAY_KEY'
  | 'INVALID_BASE_URL'
  | 'AUTH_FAILED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'UNKNOWN';

export type LlmProviderError = {
  code: LlmProviderErrorCode;
  message: string;
  retryable?: boolean;
  statusCode?: number;
};

export type LlmStreamEvent =
  | { type: 'start'; providerId: string; model: string }
  | { type: 'delta'; text: string }
  | { type: 'usage'; tokenUsage: TokenUsage }
  | { type: 'done'; finishReason?: string }
  | { type: 'error'; error: LlmProviderError };

export type TestConnectionInput = {
  provider: ResolvedLlmProvider;
  timeoutMs?: number;
};

export type TestConnectionResult = {
  ok: boolean;
  providerId: string;
  model: string;
  latencyMs: number;
  message: string;
  tokenUsage?: TokenUsage;
  error?: LlmProviderError;
};

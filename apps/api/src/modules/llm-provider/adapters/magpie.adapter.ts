import { Injectable } from '@nestjs/common';
import { LLMProviderType } from '@prisma/client';
import { LlmProviderAdapter } from './llm-provider-adapter.interface';
import {
  GenerateTextInput,
  GenerateTextResult,
  LlmProviderError,
  LlmStreamEvent,
  StreamTextInput,
  TestConnectionInput,
  TestConnectionResult,
  TokenUsage,
} from '../types/llm-provider.types';

const DEFAULT_TIMEOUT_MS = 30_000;

@Injectable()
export class MagpieAdapter implements LlmProviderAdapter {
  readonly type = LLMProviderType.magpie;

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const response = await this.requestJson(input.provider.baseUrl, '/chat/completions', input.provider.gatewayKey, {
      model: input.provider.model,
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      stream: false,
    }, input.abortSignal);

    const text = this.extractText(response);
    return {
      text,
      finishReason: this.extractFinishReason(response),
      tokenUsage: this.extractTokenUsage(response),
      raw: response,
    };
  }

  async *streamText(input: StreamTextInput): AsyncIterable<LlmStreamEvent> {
    yield { type: 'start', providerId: input.provider.id, model: input.provider.model };

    const response = await this.requestStream(input.provider.baseUrl, '/chat/completions', input.provider.gatewayKey, {
      model: input.provider.model,
      messages: input.messages,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      stream: true,
    }, input.abortSignal);

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: { code: 'PROVIDER_ERROR', message: 'Magpie returned an empty stream', retryable: true } };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const event = this.parseSseLine(line);
        if (!event) continue;
        if (event === '[DONE]') {
          yield { type: 'done', finishReason: 'stop' };
          return;
        }

        try {
          const json = JSON.parse(event);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            yield { type: 'delta', text: delta };
          }
          const usage = this.extractTokenUsage(json);
          if (usage) {
            yield { type: 'usage', tokenUsage: usage };
          }
          const finishReason = json?.choices?.[0]?.finish_reason;
          if (typeof finishReason === 'string' && finishReason.length > 0) {
            yield { type: 'done', finishReason };
            return;
          }
        } catch {
          yield { type: 'error', error: { code: 'PROVIDER_ERROR', message: 'Failed to parse Magpie stream event', retryable: false } };
          return;
        }
      }
    }

    yield { type: 'done', finishReason: 'stop' };
  }

  async testConnection(input: TestConnectionInput): Promise<TestConnectionResult> {
    const startedAt = Date.now();
    try {
      const result = await this.generateText({
        provider: input.provider,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        temperature: 0,
        maxTokens: 8,
      });

      return {
        ok: result.text.trim().length > 0,
        providerId: input.provider.id,
        model: input.provider.model,
        latencyMs: Date.now() - startedAt,
        message: result.text.trim().length > 0 ? 'Magpie connection succeeded' : 'Magpie returned empty text',
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      return {
        ok: false,
        providerId: input.provider.id,
        model: input.provider.model,
        latencyMs: Date.now() - startedAt,
        message: 'Magpie connection failed',
        error: this.toProviderError(error),
      };
    }
  }

  async listModels(baseUrl: string, gatewayKey?: string | null): Promise<Array<{ id: string; object?: string; ownedBy?: string }>> {
    const response = await this.requestRaw(baseUrl, '/models', gatewayKey, { method: 'GET' });
    const json = await response.json();
    const data = Array.isArray(json?.data) ? json.data : [];

    return data
      .filter((item: unknown): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && typeof (item as Record<string, unknown>).id === 'string')
      .map((item: Record<string, unknown>) => ({
        id: item.id as string,
        object: typeof item.object === 'string' ? item.object : undefined,
        ownedBy: typeof item.owned_by === 'string' ? item.owned_by : undefined,
      }));
  }

  private async requestJson(baseUrl: string | null | undefined, path: string, gatewayKey: string | null | undefined, body: unknown, abortSignal?: AbortSignal): Promise<unknown> {
    const response = await this.requestRaw(baseUrl, path, gatewayKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortSignal,
    });

    return response.json();
  }

  private async requestStream(baseUrl: string | null | undefined, path: string, gatewayKey: string | null | undefined, body: unknown, abortSignal?: AbortSignal): Promise<Response> {
    return this.requestRaw(baseUrl, path, gatewayKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortSignal,
    });
  }

  private async requestRaw(baseUrl: string | null | undefined, path: string, gatewayKey: string | null | undefined, init: RequestInit): Promise<Response> {
    const url = this.buildUrl(baseUrl, path);
    const headers = new Headers(init.headers);
    if (gatewayKey) {
      headers.set('Authorization', `Bearer ${gatewayKey}`);
    }
    headers.set('User-Agent', 'ai-novel-workbench');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: init.signal ?? controller.signal,
      });

      if (!response.ok) {
        throw await this.errorFromResponse(response);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw { code: 'TIMEOUT', message: 'Magpie request timed out', retryable: true } satisfies LlmProviderError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(baseUrl: string | null | undefined, path: string): string {
    if (!baseUrl || baseUrl.trim().length === 0) {
      throw { code: 'INVALID_BASE_URL', message: 'Magpie baseUrl is required', retryable: false } satisfies LlmProviderError;
    }

    try {
      const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return new URL(`${normalizedBaseUrl}${normalizedPath}`).toString();
    } catch {
      throw { code: 'INVALID_BASE_URL', message: 'Magpie baseUrl is invalid', retryable: false } satisfies LlmProviderError;
    }
  }

  private async errorFromResponse(response: Response): Promise<LlmProviderError> {
    let message = `Magpie request failed with status ${response.status}`;
    try {
      const json = await response.json();
      const providerMessage = json?.error?.message || json?.message;
      if (typeof providerMessage === 'string' && providerMessage.length > 0) {
        message = providerMessage;
      }
    } catch {
      // ignore response parse error
    }

    return {
      code: this.codeFromStatus(response.status),
      message,
      retryable: response.status === 429 || response.status >= 500,
      statusCode: response.status,
    };
  }

  private codeFromStatus(status: number): LlmProviderError['code'] {
    if (status === 401 || status === 403) return 'AUTH_FAILED';
    if (status === 404) return 'MODEL_NOT_FOUND';
    if (status === 429) return 'RATE_LIMITED';
    if (status >= 500) return 'PROVIDER_ERROR';
    return 'UNKNOWN';
  }

  private extractText(response: unknown): string {
    if (!response || typeof response !== 'object') return '';
    const choices = (response as { choices?: Array<{ message?: { content?: unknown }; text?: unknown }> }).choices;
    const first = choices?.[0];
    const content = first?.message?.content ?? first?.text;
    return typeof content === 'string' ? content : '';
  }

  private extractFinishReason(response: unknown): string | undefined {
    if (!response || typeof response !== 'object') return undefined;
    const choices = (response as { choices?: Array<{ finish_reason?: unknown }> }).choices;
    const reason = choices?.[0]?.finish_reason;
    return typeof reason === 'string' ? reason : undefined;
  }

  private extractTokenUsage(response: unknown): TokenUsage | undefined {
    if (!response || typeof response !== 'object') return undefined;
    const usage = (response as { usage?: Record<string, unknown> }).usage;
    if (!usage) return undefined;

    const promptTokens = this.optionalNumber(usage.prompt_tokens);
    const completionTokens = this.optionalNumber(usage.completion_tokens);
    const totalTokens = this.optionalNumber(usage.total_tokens);

    if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) {
      return undefined;
    }

    return { promptTokens, completionTokens, totalTokens };
  }

  private optionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' ? value : undefined;
  }

  private parseSseLine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('data:')) return null;
    return trimmed.slice('data:'.length).trim();
  }

  private toProviderError(error: unknown): LlmProviderError {
    if (this.isProviderError(error)) return error;
    if (error instanceof TypeError) {
      return { code: 'NETWORK_ERROR', message: 'Cannot connect to Magpie', retryable: true };
    }
    if (error instanceof Error) {
      return { code: 'UNKNOWN', message: error.message, retryable: false };
    }
    return { code: 'UNKNOWN', message: 'Unknown Magpie error', retryable: false };
  }

  private isProviderError(error: unknown): error is LlmProviderError {
    return Boolean(error) && typeof error === 'object' && typeof (error as LlmProviderError).code === 'string' && typeof (error as LlmProviderError).message === 'string';
  }
}

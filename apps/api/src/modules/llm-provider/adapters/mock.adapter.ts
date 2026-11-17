import { Injectable } from '@nestjs/common';
import { LLMProviderType } from '@prisma/client';
import { LlmProviderAdapter } from './llm-provider-adapter.interface';
import {
  GenerateTextInput,
  GenerateTextResult,
  LlmStreamEvent,
  StreamTextInput,
  TestConnectionInput,
  TestConnectionResult,
  TokenUsage,
} from '../types/llm-provider.types';

const DEFAULT_MOCK_TEXT = '夜色压在城墙上，风从旧巷深处吹来。她停在门前，听见屋内传来一声极轻的叹息。';

type MockProviderConfig = {
  text?: string;
  chunkSize?: number;
  latencyMs?: number;
  shouldFail?: boolean;
};

@Injectable()
export class MockAdapter implements LlmProviderAdapter {
  readonly type = LLMProviderType.mock;

  async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
    const config = this.parseConfig(input.provider.config);
    if (config.shouldFail) {
      throw new Error('Mock provider configured to fail');
    }

    await this.delay(config.latencyMs ?? 0);
    const text = config.text || DEFAULT_MOCK_TEXT;

    return {
      text,
      finishReason: 'stop',
      tokenUsage: this.estimateUsage(input.messages.map((message) => message.content).join('\n'), text),
      raw: { provider: 'mock' },
    };
  }

  async *streamText(input: StreamTextInput): AsyncIterable<LlmStreamEvent> {
    const config = this.parseConfig(input.provider.config);
    yield { type: 'start', providerId: input.provider.id, model: input.provider.model };

    if (config.shouldFail) {
      yield {
        type: 'error',
        error: {
          code: 'PROVIDER_ERROR',
          message: 'Mock provider configured to fail',
          retryable: true,
        },
      };
      return;
    }

    const text = config.text || DEFAULT_MOCK_TEXT;
    const chunkSize = Math.max(1, config.chunkSize ?? 8);
    for (let index = 0; index < text.length; index += chunkSize) {
      await this.delay(config.latencyMs ?? 0);
      yield { type: 'delta', text: text.slice(index, index + chunkSize) };
    }

    yield { type: 'usage', tokenUsage: this.estimateUsage(input.messages.map((message) => message.content).join('\n'), text) };
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
        ok: true,
        providerId: input.provider.id,
        model: input.provider.model,
        latencyMs: Date.now() - startedAt,
        message: 'Mock provider connection succeeded',
        tokenUsage: result.tokenUsage,
      };
    } catch (error) {
      return {
        ok: false,
        providerId: input.provider.id,
        model: input.provider.model,
        latencyMs: Date.now() - startedAt,
        message: 'Mock provider connection failed',
        error: {
          code: 'PROVIDER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown mock provider error',
          retryable: true,
        },
      };
    }
  }

  private parseConfig(config: unknown): MockProviderConfig {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return {};
    }

    const raw = config as Record<string, unknown>;
    return {
      text: typeof raw.text === 'string' ? raw.text : undefined,
      chunkSize: typeof raw.chunkSize === 'number' ? raw.chunkSize : undefined,
      latencyMs: typeof raw.latencyMs === 'number' ? raw.latencyMs : undefined,
      shouldFail: typeof raw.shouldFail === 'boolean' ? raw.shouldFail : undefined,
    };
  }

  private estimateUsage(prompt: string, completion: string): TokenUsage {
    const promptTokens = Math.max(1, Math.ceil(prompt.length / 4));
    const completionTokens = Math.max(1, Math.ceil(completion.length / 4));
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };
  }

  private delay(ms: number): Promise<void> {
    if (ms <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import { LLMProviderType } from '@prisma/client';
import {
  GenerateTextInput,
  GenerateTextResult,
  LlmStreamEvent,
  StreamTextInput,
  TestConnectionInput,
  TestConnectionResult,
} from '../types/llm-provider.types';

export interface LlmProviderAdapter {
  readonly type: LLMProviderType;

  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;

  streamText(input: StreamTextInput): AsyncIterable<LlmStreamEvent>;

  testConnection(input: TestConnectionInput): Promise<TestConnectionResult>;
}

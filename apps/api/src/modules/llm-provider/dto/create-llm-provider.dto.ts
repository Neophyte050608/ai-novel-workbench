import { LLMProviderType } from '@prisma/client';

export class CreateLlmProviderDto {
  projectId?: string;
  name?: string;
  type?: LLMProviderType;
  baseUrl?: string;
  model?: string;
  gatewayKey?: string;
  config?: Record<string, unknown>;
  isDefault?: boolean;
  isEnabled?: boolean;
}

export class UpdateLlmProviderDto {
  name?: string;
  baseUrl?: string;
  model?: string;
  gatewayKey?: string;
  clearGatewayKey?: boolean;
  config?: Record<string, unknown>;
  isDefault?: boolean;
  isEnabled?: boolean;
}

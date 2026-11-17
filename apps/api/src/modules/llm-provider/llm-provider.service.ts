import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { LLMProvider, LLMProviderType, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { DatabaseSecretStore } from '../../infrastructure/secrets/database-secret-store.service';
import { MagpieAdapter } from './adapters/magpie.adapter';
import { CreateLlmProviderDto } from './dto/create-llm-provider.dto';
import { MagpieModelsDto } from './dto/magpie-models.dto';
import { TestMagpieConnectionDto } from './dto/test-magpie-connection.dto';
import { UpdateLlmProviderDto } from './dto/update-llm-provider.dto';
import { ResolvedLlmProvider } from './types/llm-provider.types';

const DEFAULT_MAGPIE_PORT = 3425;
const DEFAULT_MAGPIE_GATEWAY_KEY = 'magpie-ai-novel-workbench';
const ALLOWED_CONFIG_KEYS = new Set(['timeoutMs', 'maxRetries', 'defaultTemperature', 'defaultMaxTokens']);
const SENSITIVE_KEY_PATTERN = /(api[-_]?key|gateway[-_]?key|secret|token|password|authorization|bearer|credential)/i;

type LlmProviderResponse = Omit<LLMProvider, 'secretRef'> & {
  hasGatewayKey: boolean;
};

@Injectable()
export class LlmProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly magpieAdapter: MagpieAdapter,
    private readonly secretStore: DatabaseSecretStore,
  ) {}

  async list(): Promise<LlmProviderResponse[]> {
    const providers = await this.prisma.lLMProvider.findMany({
      where: { deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    return Promise.all(providers.map((provider) => this.toResponse(provider)));
  }

  async get(id: string): Promise<LlmProviderResponse> {
    const provider = await this.findProvider(id);
    return this.toResponse(provider);
  }

  async create(dto: CreateLlmProviderDto): Promise<LlmProviderResponse> {
    const type = dto.type ?? LLMProviderType.magpie;
    this.assertSupportedProviderType(type);
    const baseUrl = this.normalizeBaseUrl(dto.baseUrl);
    const model = this.normalizeModel(dto.model);
    const name = this.normalizeName(dto.name);
    const isDefault = this.optionalBoolean(dto.isDefault, 'isDefault') ?? false;
    const isEnabled = this.optionalBoolean(dto.isEnabled, 'isEnabled') ?? true;
    const gatewayKey = this.normalizeGatewayKey(dto.gatewayKey);

    const provider = await this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.lLMProvider.updateMany({
          where: { projectId: dto.projectId ?? null, deletedAt: null },
          data: { isDefault: false },
        });
      }

      const created = await tx.lLMProvider.create({
        data: {
          projectId: dto.projectId,
          name,
          type,
          baseUrl,
          model,
          config: this.normalizeConfig(dto.config),
          isDefault,
          isEnabled,
        },
      });

      const secretRef = this.buildSecretRef(created.id);
      const updated = await tx.lLMProvider.update({
        where: { id: created.id },
        data: { secretRef },
      });

      if (gatewayKey) {
        await this.secretStore.setSecretWithClient(tx, secretRef, gatewayKey);
      }

      return updated;
    });

    return this.toResponse(provider);
  }

  async update(id: string, dto: UpdateLlmProviderDto): Promise<LlmProviderResponse> {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('request body cannot be empty');
    }

    const existing = await this.findProvider(id);
    const data: Prisma.LLMProviderUpdateInput = {};
    const gatewayKey = this.normalizeGatewayKey(dto.gatewayKey);
    const clearGatewayKey = this.optionalBoolean(dto.clearGatewayKey, 'clearGatewayKey') ?? false;

    if (dto.name !== undefined) data.name = this.normalizeName(dto.name);
    if (dto.baseUrl !== undefined) data.baseUrl = this.normalizeBaseUrl(dto.baseUrl);
    if (dto.model !== undefined) data.model = this.normalizeModel(dto.model);
    if (dto.config !== undefined) data.config = this.normalizeConfig(dto.config) as Prisma.InputJsonValue;
    if (dto.isEnabled !== undefined) data.isEnabled = this.requiredBoolean(dto.isEnabled, 'isEnabled');

    const provider = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault !== undefined) {
        const isDefault = this.requiredBoolean(dto.isDefault, 'isDefault');
        data.isDefault = isDefault;
        if (isDefault) {
          await tx.lLMProvider.updateMany({
            where: { projectId: existing.projectId, deletedAt: null, id: { not: id } },
            data: { isDefault: false },
          });
        }
      }

      const updated = await tx.lLMProvider.update({ where: { id }, data });
      if (clearGatewayKey && updated.secretRef) {
        await this.secretStore.deleteSecretWithClient(tx, updated.secretRef);
      } else if (gatewayKey && updated.secretRef) {
        await this.secretStore.setSecretWithClient(tx, updated.secretRef, gatewayKey);
      }

      return updated;
    });

    return this.toResponse(provider);
  }

  async remove(id: string): Promise<LlmProviderResponse> {
    const existing = await this.findProvider(id);
    const provider = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.lLMProvider.update({
        where: { id },
        data: { deletedAt: new Date(), isEnabled: false, isDefault: false },
      });

      if (existing.secretRef) {
        await this.secretStore.deleteSecretWithClient(tx, existing.secretRef);
      }

      return updated;
    });

    return this.toResponse(provider);
  }

  async setDefault(id: string): Promise<LlmProviderResponse> {
    const existing = await this.findProvider(id);

    const provider = await this.prisma.$transaction(async (tx) => {
      await tx.lLMProvider.updateMany({
        where: { projectId: existing.projectId, deletedAt: null, id: { not: id } },
        data: { isDefault: false },
      });

      return tx.lLMProvider.update({
        where: { id },
        data: { isDefault: true, isEnabled: true },
      });
    });

    return this.toResponse(provider);
  }

  async testProvider(id: string) {
    const provider = await this.resolveProvider(id);
    return this.magpieAdapter.testConnection({ provider });
  }

  async discoverMagpie() {
    const port = this.readMagpiePort() ?? DEFAULT_MAGPIE_PORT;
    const serviceUrl = `http://127.0.0.1:${port}`;

    try {
      const response = await fetch(`${serviceUrl}/api/hello`, {
        headers: { 'User-Agent': 'ai-novel-workbench' },
        signal: AbortSignal.timeout(2_000),
      });

      if (!response.ok) {
        return {
          found: false,
          message: `Magpie responded with status ${response.status}`,
        };
      }

      const data = await response.json();
      if (data?.name !== 'magpie') {
        return {
          found: false,
          message: 'Local service is not Magpie',
        };
      }

      return {
        found: true,
        baseUrl: `${serviceUrl}/v1`,
        version: typeof data.version === 'string' ? data.version : undefined,
        message: 'Magpie detected',
      };
    } catch {
      return {
        found: false,
        baseUrl: `${serviceUrl}/v1`,
        message: 'Magpie is not running or cannot be reached',
      };
    }
  }

  async listMagpieModels(dto: MagpieModelsDto) {
    const baseUrl = this.normalizeBaseUrl(dto.baseUrl);
    const gatewayKey = this.normalizeGatewayKey(dto.gatewayKey) || DEFAULT_MAGPIE_GATEWAY_KEY;
    const models = await this.magpieAdapter.listModels(baseUrl, gatewayKey);

    return {
      baseUrl,
      models,
      count: models.length,
    };
  }

  async testMagpieConnection(dto: TestMagpieConnectionDto) {
    const baseUrl = this.normalizeBaseUrl(dto.baseUrl);
    const model = this.normalizeModel(dto.model);
    const provider: ResolvedLlmProvider = {
      id: 'magpie-preview',
      name: 'Magpie',
      type: LLMProviderType.magpie,
      baseUrl,
      model,
      gatewayKey: this.normalizeGatewayKey(dto.gatewayKey) || DEFAULT_MAGPIE_GATEWAY_KEY,
    };

    return this.magpieAdapter.testConnection({ provider });
  }

  private async findProvider(id: string): Promise<LLMProvider> {
    const provider = await this.prisma.lLMProvider.findFirst({ where: { id, deletedAt: null } });
    if (!provider) {
      throw new NotFoundException(`LLMProvider ${id} not found`);
    }
    return provider;
  }

  private async resolveProvider(id: string): Promise<ResolvedLlmProvider> {
    const provider = await this.findProvider(id);
    this.assertSupportedProviderType(provider.type);
    const gatewayKey = provider.secretRef ? await this.secretStore.getSecret(provider.secretRef) : null;

    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      model: provider.model,
      gatewayKey: gatewayKey || DEFAULT_MAGPIE_GATEWAY_KEY,
      config: provider.config,
    };
  }

  private async toResponse(provider: LLMProvider): Promise<LlmProviderResponse> {
    const { secretRef, ...safeProvider } = provider;
    return {
      ...safeProvider,
      config: this.redactConfig(safeProvider.config),
      hasGatewayKey: secretRef ? await this.secretStore.hasSecret(secretRef) : false,
    };
  }

  private buildSecretRef(providerId: string): string {
    return `llm-provider:${providerId}:gateway-key`;
  }

  private assertSupportedProviderType(type: LLMProviderType): void {
    if (type !== LLMProviderType.magpie) {
      throw new BadRequestException('Only Magpie provider is supported in the first version');
    }
  }

  private normalizeName(name?: string): string {
    const value = name?.trim() || 'Magpie';
    if (value.length === 0) {
      throw new BadRequestException('name cannot be empty');
    }
    return value;
  }

  private normalizeGatewayKey(gatewayKey?: string | null): string | undefined {
    const value = gatewayKey?.trim();
    return value && value.length > 0 ? value : undefined;
  }

  private normalizeBaseUrl(baseUrl?: string | null): string {
    const value = baseUrl?.trim() || `http://127.0.0.1:${DEFAULT_MAGPIE_PORT}/v1`;
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('invalid protocol');
      }
      if (!this.isAllowedLocalMagpieHost(url.hostname)) {
        throw new Error('non-local host');
      }
      return value.replace(/\/+$/, '');
    } catch {
      throw new BadRequestException('baseUrl must be a local Magpie http(s) URL, e.g. http://127.0.0.1:3425/v1');
    }
  }

  private isAllowedLocalMagpieHost(hostname: string): boolean {
    return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(hostname.toLowerCase());
  }

  private normalizeModel(model?: string | null): string {
    const value = model?.trim();
    if (!value) {
      throw new BadRequestException('model is required');
    }
    return value;
  }

  private normalizeConfig(config?: Record<string, unknown>): Prisma.InputJsonObject | undefined {
    if (config === undefined) {
      return undefined;
    }
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new BadRequestException('config must be an object');
    }
    this.assertNoSensitiveConfig(config);

    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(config)) {
      if (!ALLOWED_CONFIG_KEYS.has(key)) {
        throw new BadRequestException(`Unsupported config key: ${key}`);
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new BadRequestException(`config.${key} must be a finite number`);
      }
      normalized[key] = value;
    }
    return normalized as Prisma.InputJsonObject;
  }

  private assertNoSensitiveConfig(value: unknown, path = 'config'): void {
    if (!value || typeof value !== 'object') return;
    for (const [key, nestedValue] of Object.entries(value)) {
      const nextPath = `${path}.${key}`;
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        throw new BadRequestException(`${nextPath} must be stored in SecretStore, not config`);
      }
      this.assertNoSensitiveConfig(nestedValue, nextPath);
    }
  }

  private redactConfig(config: Prisma.JsonValue): Prisma.JsonValue {
    if (!config || typeof config !== 'object') return config;
    if (Array.isArray(config)) return config.map((item) => this.redactConfig(item));

    const result: Record<string, Prisma.JsonValue> = {};
    for (const [key, value] of Object.entries(config)) {
      result[key] = SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : this.redactConfig(value as Prisma.JsonValue);
    }
    return result;
  }

  private optionalBoolean(value: unknown, fieldName: string): boolean | undefined {
    if (value === undefined) return undefined;
    return this.requiredBoolean(value, fieldName);
  }

  private requiredBoolean(value: unknown, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${fieldName} must be a boolean`);
    }
    return value;
  }

  private readMagpiePort(): number | null {
    const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
    const settingsPath = join(configHome, 'magpie', 'settings.json');
    if (!existsSync(settingsPath)) {
      return null;
    }

    try {
      const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
      const port = Number(settings?.port);
      return Number.isInteger(port) && port > 0 ? port : null;
    } catch {
      return null;
    }
  }
}

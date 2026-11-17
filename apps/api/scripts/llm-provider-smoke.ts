import { LLMProviderType } from '@prisma/client';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';
import { LocalMasterKeyService } from '../src/infrastructure/secrets/local-master-key.service';
import { DatabaseSecretStore } from '../src/infrastructure/secrets/database-secret-store.service';
import { MagpieAdapter } from '../src/modules/llm-provider/adapters/magpie.adapter';
import { MockAdapter } from '../src/modules/llm-provider/adapters/mock.adapter';
import { LlmProviderService } from '../src/modules/llm-provider/llm-provider.service';

async function expectReject(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return { name, rejected: false };
  } catch {
    return { name, rejected: true };
  }
}

async function collectStream(adapter: MockAdapter) {
  const events = [];
  for await (const event of adapter.streamText({
    provider: {
      id: 'mock-smoke',
      name: 'Mock',
      type: LLMProviderType.mock,
      model: 'mock-novel',
      config: { text: 'abcdef', chunkSize: 2 },
    },
    messages: [{ role: 'user', content: 'test' }],
  })) {
    events.push(event);
  }
  return events;
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const secretStore = new DatabaseSecretStore(prisma, new LocalMasterKeyService());
  const service = new LlmProviderService(prisma, new MagpieAdapter(), secretStore);
  const mock = new MockAdapter();

  const checks = [];
  checks.push(await expectReject('sensitiveConfigRejected', () => service.create({
    type: LLMProviderType.magpie,
    model: 'smoke/model',
    config: { apiKey: 'leak' },
  })));
  checks.push(await expectReject('remoteBaseUrlRejected', () => service.create({
    type: LLMProviderType.magpie,
    baseUrl: 'https://example.com/v1',
    model: 'smoke/model',
  })));
  checks.push(await expectReject('booleanStringRejected', () => service.create({
    type: LLMProviderType.magpie,
    model: 'smoke/model',
    isEnabled: 'false' as unknown as boolean,
  })));

  const created = await service.create({
    type: LLMProviderType.magpie,
    model: 'smoke/model',
    gatewayKey: 'magpie-smoke-secret',
    config: { timeoutMs: 1000 },
  });
  const rawBeforeDelete = await prisma.lLMProvider.findUnique({ where: { id: created.id } });
  const hadSecretBeforeDelete = rawBeforeDelete?.secretRef ? await secretStore.hasSecret(rawBeforeDelete.secretRef) : false;
  const fetched = await service.get(created.id);
  const updated = await service.update(created.id, { gatewayKey: 'magpie-smoke-secret-2', model: 'smoke/model-2' });
  const rawAfterUpdate = await prisma.lLMProvider.findUnique({ where: { id: created.id } });
  const secretUpdated = rawAfterUpdate?.secretRef ? (await secretStore.getSecret(rawAfterUpdate.secretRef)) === 'magpie-smoke-secret-2' : false;
  const removed = await service.remove(created.id);
  const hasSecretAfterDelete = rawAfterUpdate?.secretRef ? await secretStore.hasSecret(rawAfterUpdate.secretRef) : false;
  await prisma.lLMProvider.delete({ where: { id: created.id } });

  const mockResult = await mock.generateText({
    provider: { id: 'mock-smoke', name: 'Mock', type: LLMProviderType.mock, model: 'mock-novel' },
    messages: [{ role: 'user', content: 'test' }],
  });
  const mockEvents = await collectStream(mock);
  const mockTest = await mock.testConnection({
    provider: { id: 'mock-smoke', name: 'Mock', type: LLMProviderType.mock, model: 'mock-novel' },
  });

  await prisma.$disconnect();

  const result = {
    checks,
    provider: {
      createdHasGatewayKey: created.hasGatewayKey,
      fetchedHasGatewayKey: fetched.hasGatewayKey,
      updatedModel: updated.model,
      removedDeleted: Boolean(removed.deletedAt),
      responseLeaksSecretRef: 'secretRef' in created || 'secretRef' in fetched || 'secretRef' in updated,
      hadSecretBeforeDelete,
      hasSecretAfterDelete,
      secretUpdated,
      config: created.config,
    },
    mock: {
      generated: mockResult.text.length > 0,
      streamEvents: mockEvents.map((event) => event.type),
      testOk: mockTest.ok,
    },
  };

  const failed = checks.some((check) => !check.rejected)
    || !created.hasGatewayKey
    || !fetched.hasGatewayKey
    || updated.model !== 'smoke/model-2'
    || !removed.deletedAt
    || ('secretRef' in created)
    || !hadSecretBeforeDelete
    || hasSecretAfterDelete
    || !secretUpdated
    || !mockResult.text
    || !mockTest.ok
    || !mockEvents.some((event) => event.type === 'delta')
    || !mockEvents.some((event) => event.type === 'done');

  console.log(JSON.stringify(result, null, 2));
  if (failed) {
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});

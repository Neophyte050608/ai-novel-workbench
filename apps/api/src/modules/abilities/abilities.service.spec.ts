import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AbilitiesService } from './abilities.service';

type AnyRecord = Record<string, any>;
function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const abilities: AnyRecord[] = [];
  const rules: AnyRecord[] = [];
  const worldRules: AnyRecord[] = [{ id: 'rule-1', projectId: 'project-1', deletedAt: null }];
  let idCounter = 1;
  const matches = (row: AnyRecord, where: AnyRecord) => Object.entries(where).every(([key, value]) => row[key] === value);
  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => !orderBy ? rows : [...rows].sort((a, b) => { for (const order of (Array.isArray(orderBy) ? orderBy : [orderBy])) { const [field, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc']; const av = a[field] instanceof Date ? a[field].getTime() : a[field]; const bv = b[field] instanceof Date ? b[field].getTime() : b[field]; if (av !== bv) return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1); } return 0; });
  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy),
    create: async ({ data }: AnyRecord) => { const now = new Date(); const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, deletedAt: null, ...data }; rows.push(row); return row; },
    update: async ({ where, data }: AnyRecord) => { const row = rows.find((item) => matches(item, where)); if (!row) throw new Error(`${prefix} not found`); Object.assign(row, data, { updatedAt: new Date() }); return row; },
    delete: async ({ where }: AnyRecord) => rows.splice(rows.findIndex((item) => matches(item, where)), 1)[0],
  });
  return { prisma: { project: makeModel(projects, 'project'), ability: makeModel(abilities, 'ability'), abilityRule: makeModel(rules, 'rule'), worldRule: makeModel(worldRules, 'world-rule') } };
}

async function testCreateProfileAndTrim() {
  const { prisma } = createPrismaStub();
  const service = new AbilitiesService(prisma as any);
  const ability = await service.createAbility('project-1', { name: ' 御剑术 ', aliases: [' 飞剑 ', ' '] });
  const rule = await service.createRule('project-1', ability.id, { worldRuleId: ' rule-1 ' });
  const profile = await service.getProfile('project-1', ability.id);
  assert.equal(ability.name, '御剑术');
  assert.deepEqual(ability.aliases, ['飞剑']);
  assert.equal(rule.worldRuleId, 'rule-1');
  assert.equal(profile.ability.id, ability.id);
  assert.equal(profile.rules[0].id, rule.id);
}

async function testBoundaries() {
  const { prisma } = createPrismaStub();
  const service = new AbilitiesService(prisma as any);
  const ability = await service.createAbility('project-1', { name: '御剑术' });
  await assert.rejects(() => service.createRule('project-1', ability.id, { worldRuleId: 'foreign-rule' }), (error) => error instanceof BadRequestException);
  await assert.rejects(() => service.getAbility('project-2', ability.id), (error) => error instanceof NotFoundException);
}

async function run() {
  await testCreateProfileAndTrim();
  await testBoundaries();
  console.log('abilities service behavior tests passed');
}
run().catch((error) => { console.error(error); process.exit(1); });

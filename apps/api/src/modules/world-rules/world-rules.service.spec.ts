import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorldRulesService } from './world-rules.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const worldRules: AnyRecord[] = [];
  let idCounter = 1;

  const matches = (row: AnyRecord, where: AnyRecord): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && 'in' in value) {
        return value.in.includes(row[key]);
      }
      return row[key] === value;
    });

  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => {
    if (!orderBy) return rows;
    const orders = Array.isArray(orderBy) ? orderBy : [orderBy];
    return [...rows].sort((a, b) => {
      for (const order of orders) {
        const [field, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc'];
        const av = a[field] instanceof Date ? a[field].getTime() : a[field];
        const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
        if (av !== bv) return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
      }
      return 0;
    });
  };

  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy),
    create: async ({ data }: AnyRecord) => {
      const now = new Date();
      const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, deletedAt: null, ...data };
      rows.push(row);
      return row;
    },
    update: async ({ where, data }: AnyRecord) => {
      const row = rows.find((item) => matches(item, where));
      if (!row) throw new Error(`${prefix} not found`);
      Object.assign(row, data, { updatedAt: new Date() });
      return row;
    },
  });

  return {
    data: { projects, worldRules },
    prisma: {
      project: makeModel(projects, 'project'),
      worldRule: makeModel(worldRules, 'world-rule'),
    },
  };
}

async function testCreateWorldRuleDraftFirst() {
  const { prisma } = createPrismaStub();
  const service = new WorldRulesService(prisma as any);

  const rule = await service.createWorldRule('project-1', {
    title: '  灵力守恒  ',
    ruleType: 'magic',
    priority: 'high',
    isHardRule: true,
  });

  assert.equal(rule.title, '灵力守恒');
  assert.equal(rule.projectId, 'project-1');
  assert.equal(rule.canonStatus, 'draft');
  assert.equal(rule.status, 'active');
  assert.equal(rule.priority, 'high');
  assert.equal(rule.isHardRule, true);
}

async function testListWorldRulesHidesDeletedAndOrdersByImportance() {
  const { prisma } = createPrismaStub();
  const service = new WorldRulesService(prisma as any);
  const low = await service.createWorldRule('project-1', { title: '低优先', importance: 1 });
  const high = await service.createWorldRule('project-1', { title: '高优先', importance: 10 });
  const deleted = await service.createWorldRule('project-1', { title: '已删除', importance: 99 });
  await service.deleteWorldRule('project-1', deleted.id);

  const rules = await service.listWorldRules('project-1');

  assert.deepEqual(rules.map((item: any) => item.id), [high.id, low.id]);
}

async function testProjectBoundaryRejectsForeignWorldRule() {
  const { prisma } = createPrismaStub();
  const service = new WorldRulesService(prisma as any);
  const rule = await service.createWorldRule('project-1', { title: '灵力守恒' });

  await assert.rejects(
    () => service.getWorldRule('project-2', rule.id),
    (error) => error instanceof NotFoundException,
  );
}

async function testRejectsInvalidImportanceAndEmptyUpdate() {
  const { prisma } = createPrismaStub();
  const service = new WorldRulesService(prisma as any);
  const rule = await service.createWorldRule('project-1', { title: '灵力守恒' });

  await assert.rejects(
    () => service.createWorldRule('project-1', { title: '灵力守恒', importance: -1 }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.updateWorldRule('project-1', rule.id, { importance: 1.5 }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.updateWorldRule('project-1', rule.id, {}),
    (error) => error instanceof BadRequestException,
  );
}

async function run() {
  await testCreateWorldRuleDraftFirst();
  await testListWorldRulesHidesDeletedAndOrdersByImportance();
  await testProjectBoundaryRejectsForeignWorldRule();
  await testRejectsInvalidImportanceAndEmptyUpdate();
  console.log('world rules service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

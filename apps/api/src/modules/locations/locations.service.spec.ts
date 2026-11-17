import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LocationsService } from './locations.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const locations: AnyRecord[] = [];
  const states: AnyRecord[] = [];
  const rules: AnyRecord[] = [];
  const factions: AnyRecord[] = [];
  const worldRules: AnyRecord[] = [{ id: 'rule-1', projectId: 'project-1', deletedAt: null }];
  const factionRows: AnyRecord[] = [{ id: 'faction-1', projectId: 'project-1', deletedAt: null }];
  const chapters: AnyRecord[] = [{ id: 'chapter-1', projectId: 'project-1', deletedAt: null }];
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
    delete: async ({ where }: AnyRecord) => {
      const index = rows.findIndex((item) => matches(item, where));
      if (index < 0) throw new Error(`${prefix} not found`);
      return rows.splice(index, 1)[0];
    },
  });

  return {
    data: { projects, locations, states, rules, factions, worldRules, factionRows, chapters },
    prisma: {
      project: makeModel(projects, 'project'),
      location: makeModel(locations, 'location'),
      locationState: makeModel(states, 'state'),
      locationRule: makeModel(rules, 'location-rule'),
      locationFaction: makeModel(factions, 'location-faction'),
      worldRule: makeModel(worldRules, 'world-rule'),
      faction: makeModel(factionRows, 'faction'),
      chapter: makeModel(chapters, 'chapter'),
    },
  };
}

async function testCreateLocationDraftFirstAndTrimmed() {
  const { prisma } = createPrismaStub();
  const service = new LocationsService(prisma as any);

  const location = await service.createLocation('project-1', {
    name: '  雾港  ',
    locationType: 'city',
    aliases: ['雾都'],
  });

  assert.equal(location.name, '雾港');
  assert.equal(location.projectId, 'project-1');
  assert.equal(location.canonStatus, 'draft');
  assert.deepEqual(location.aliases, ['雾都']);
}

async function testProfileUsesLatestStateRulesAndCurrentFactions() {
  const { prisma } = createPrismaStub();
  const service = new LocationsService(prisma as any);
  const location = await service.createLocation('project-1', { name: '雾港' });
  await service.createState('project-1', location.id, { stage: 'old', orderIndex: 1, chapterId: 'chapter-1' });
  const latest = await service.createState('project-1', location.id, { stage: 'new', orderIndex: 2 });
  const link = await service.createRule('project-1', location.id, { worldRuleId: 'rule-1', isPrimary: true });
  const faction = await service.createFaction('project-1', location.id, { factionId: 'faction-1', relationType: 'controls' });
  const ended = await service.createFaction('project-1', location.id, { factionId: 'faction-1', isCurrent: false });
  await service.deleteFaction('project-1', location.id, ended.id);

  const profile = await service.getProfile('project-1', location.id);

  assert.equal(profile.location.id, location.id);
  assert.equal(profile.latestState?.id, latest.id);
  assert.deepEqual(profile.rules.map((item: any) => item.id), [link.id]);
  assert.deepEqual(profile.factions.map((item: any) => item.id), [faction.id]);
}

async function testLocationRelationsEnforceProjectBoundary() {
  const { prisma } = createPrismaStub();
  const service = new LocationsService(prisma as any);
  const location = await service.createLocation('project-1', { name: '雾港' });

  await assert.rejects(
    () => service.createRule('project-1', location.id, { worldRuleId: 'foreign-rule' }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.getLocation('project-2', location.id),
    (error) => error instanceof NotFoundException,
  );
}

async function testWhitespaceRelationIdsAreTrimmedBeforeBoundaryChecks() {
  const { prisma } = createPrismaStub();
  const service = new LocationsService(prisma as any);
  const parent = await service.createLocation('project-1', { name: '上城' });
  const child = await service.createLocation('project-1', { name: '雾港', parentId: ` ${parent.id} ` });
  const linkedRule = await service.createRule('project-1', child.id, { worldRuleId: ' rule-1 ' });
  const linkedFaction = await service.createFaction('project-1', child.id, { factionId: ' faction-1 ' });

  assert.equal(child.parentId, parent.id);
  assert.equal(linkedRule.worldRuleId, 'rule-1');
  assert.equal(linkedFaction.factionId, 'faction-1');
  await assert.rejects(
    () => service.updateLocation('project-1', child.id, { parentId: '   ' }),
    (error) => error instanceof BadRequestException,
  );
}

async function run() {
  await testCreateLocationDraftFirstAndTrimmed();
  await testProfileUsesLatestStateRulesAndCurrentFactions();
  await testLocationRelationsEnforceProjectBoundary();
  await testWhitespaceRelationIdsAreTrimmedBeforeBoundaryChecks();
  console.log('locations service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

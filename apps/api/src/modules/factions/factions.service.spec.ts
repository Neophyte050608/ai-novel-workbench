import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FactionsService } from './factions.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const factions: AnyRecord[] = [];
  const states: AnyRecord[] = [];
  const memberships: AnyRecord[] = [];
  const relations: AnyRecord[] = [];
  const rules: AnyRecord[] = [];
  const locationFactions: AnyRecord[] = [];
  const characters: AnyRecord[] = [{ id: 'character-1', projectId: 'project-1', deletedAt: null }];
  const worldRules: AnyRecord[] = [{ id: 'rule-1', projectId: 'project-1', deletedAt: null }];
  const chapters: AnyRecord[] = [{ id: 'chapter-1', projectId: 'project-1', deletedAt: null }];
  let idCounter = 1;

  const matchesValue = (rowValue: any, expected: any): boolean => {
    if (expected && typeof expected === 'object' && 'in' in expected) {
      return expected.in.includes(rowValue);
    }
    if (expected && typeof expected === 'object' && 'contains' in expected) {
      const source = String(rowValue ?? '');
      const needle = String(expected.contains ?? '');
      return expected.mode === 'insensitive' ? source.toLowerCase().includes(needle.toLowerCase()) : source.includes(needle);
    }
    if (expected === null) {
      return rowValue == null;
    }
    return rowValue === expected;
  };

  const matches = (row: AnyRecord, where: AnyRecord): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (key === 'OR' && Array.isArray(value)) {
        return value.some((item) => matches(row, item));
      }
      return matchesValue(row[key], value);
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
    findMany: async ({ where, orderBy, skip, take }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy).slice(skip ?? 0, take === undefined ? undefined : (skip ?? 0) + take),
    count: async ({ where }: AnyRecord) => rows.filter((row) => matches(row, where)).length,
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
    data: { projects, factions, states, memberships, relations, rules, locationFactions, characters, worldRules, chapters },
    prisma: {
      project: makeModel(projects, 'project'),
      faction: makeModel(factions, 'faction'),
      factionState: makeModel(states, 'state'),
      factionMembership: makeModel(memberships, 'membership'),
      factionRelation: makeModel(relations, 'relation'),
      factionRule: makeModel(rules, 'rule'),
      locationFaction: makeModel(locationFactions, 'location-faction'),
      character: makeModel(characters, 'character'),
      worldRule: makeModel(worldRules, 'world-rule'),
      chapter: makeModel(chapters, 'chapter'),
    },
  };
}

async function testCreateFactionDraftFirstParentAndListFilters() {
  const { prisma } = createPrismaStub();
  const service = new FactionsService(prisma as any);

  const parent = await service.createFaction('project-1', { name: '  青云宗  ', aliases: [' 青云门 '], factionType: 'sect', narrativeRole: 'protagonist_side' });
  const child = await service.createFaction('project-1', { name: '剑阁', parentId: parent.id, factionType: 'sect', status: 'active' });
  const hidden = await service.createFaction('project-1', { name: '黑莲教', factionType: 'cult', status: 'hidden' });

  assert.equal(parent.name, '青云宗');
  assert.equal(parent.projectId, 'project-1');
  assert.equal(parent.canonStatus, 'draft');
  assert.deepEqual(parent.aliases, ['青云门']);

  const listed = await service.listFactions('project-1', { factionType: 'sect', parentId: parent.id, keyword: '剑', page: '1', pageSize: '10' });
  assert.equal(listed.total, 1);
  assert.deepEqual(listed.items.map((item: any) => item.id), [child.id]);

  const roots = await service.listFactions('project-1', { parentId: ' null ' });
  assert.deepEqual(roots.items.map((item: any) => item.id).sort(), [parent.id, hidden.id].sort());
}

async function testProfileUsesLatestStateAndRelations() {
  const { prisma } = createPrismaStub();
  const service = new FactionsService(prisma as any);
  const faction = await service.createFaction('project-1', { name: '青云宗' });
  const target = await service.createFaction('project-1', { name: '黑莲教' });
  await service.createState('project-1', faction.id, { stage: 'old', orderIndex: 1, chapterId: 'chapter-1' });
  const latest = await service.createState('project-1', faction.id, { stage: 'new', orderIndex: 2 });
  const membership = await service.createMembership('project-1', faction.id, { characterId: 'character-1', membershipType: 'disciple' });
  const relation = await service.createRelation('project-1', faction.id, { targetFactionId: target.id, relationType: 'enemy_of' });
  const rule = await service.createRule('project-1', faction.id, { worldRuleId: 'rule-1', isPrimary: true });

  const profile = await service.getProfile('project-1', faction.id);

  assert.equal(profile.faction.id, faction.id);
  assert.equal(profile.latestState?.id, latest.id);
  assert.deepEqual(profile.memberships.map((item: any) => item.id), [membership.id]);
  assert.deepEqual(profile.relations.map((item: any) => item.id), [relation.id]);
  assert.deepEqual(profile.rules.map((item: any) => item.id), [rule.id]);
}

async function testRelationsEnforceProjectBoundaryAndSoftDelete() {
  const { prisma } = createPrismaStub();
  const service = new FactionsService(prisma as any);
  const faction = await service.createFaction('project-1', { name: '青云宗' });
  const membership = await service.createMembership('project-1', faction.id, { characterId: 'character-1' });

  await assert.rejects(
    () => service.createMembership('project-1', faction.id, { characterId: 'missing-character' }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.getFaction('project-2', faction.id),
    (error) => error instanceof NotFoundException,
  );

  const deleted = await service.deleteMembership('project-1', faction.id, membership.id);
  assert.ok(deleted.deletedAt instanceof Date);
  const memberships = await service.listMemberships('project-1', faction.id);
  assert.deepEqual(memberships, []);
}

async function testParentCannotPointToSelf() {
  const { prisma } = createPrismaStub();
  const service = new FactionsService(prisma as any);
  const faction = await service.createFaction('project-1', { name: '青云宗' });

  await assert.rejects(
    () => service.updateFaction('project-1', faction.id, { parentId: faction.id }),
    (error) => error instanceof BadRequestException,
  );
}

async function testRelationIdsTrimAndRejectSelfRelations() {
  const { prisma } = createPrismaStub();
  const service = new FactionsService(prisma as any);
  const faction = await service.createFaction('project-1', { name: '青云宗' });
  const target = await service.createFaction('project-1', { name: '黑莲教' });

  const relation = await service.createRelation('project-1', faction.id, { targetFactionId: ` ${target.id} ` });
  assert.equal(relation.targetFactionId, target.id);
  await assert.rejects(
    () => service.createRelation('project-1', faction.id, { targetFactionId: ` ${faction.id} ` }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.updateFaction('project-1', faction.id, { parentId: '   ' }),
    (error) => error instanceof BadRequestException,
  );
}

async function run() {
  await testCreateFactionDraftFirstParentAndListFilters();
  await testProfileUsesLatestStateAndRelations();
  await testRelationsEnforceProjectBoundaryAndSoftDelete();
  await testParentCannotPointToSelf();
  await testRelationIdsTrimAndRejectSelfRelations();
  console.log('factions service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

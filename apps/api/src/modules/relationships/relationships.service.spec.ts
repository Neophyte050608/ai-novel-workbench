import { strict as assert } from 'node:assert';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const now = new Date();
  const projects = [{ id: 'project-1', deletedAt: null }, { id: 'project-2', deletedAt: null }];
  const relationships: AnyRecord[] = [];
  const characters = [
    { id: 'char-1', projectId: 'project-1', deletedAt: null },
    { id: 'char-foreign', projectId: 'project-2', deletedAt: null },
  ];
  const locations = [{ id: 'loc-1', projectId: 'project-1', deletedAt: null }];
  const factions = [{ id: 'fac-1', projectId: 'project-1', deletedAt: null }];
  const species = [{ id: 'spe-1', projectId: 'project-1', deletedAt: null }];
  const storyItems = [{ id: 'item-1', projectId: 'project-1', deletedAt: null }];
  const abilities = [{ id: 'ability-1', projectId: 'project-1', deletedAt: null }];
  const worldRules = [{ id: 'rule-1', projectId: 'project-1', deletedAt: null }];
  const worldItems = [{ id: 'world-item-1', projectId: 'project-1', deletedAt: null }];
  const chapters = [{ id: 'chapter-1', projectId: 'project-1', deletedAt: null }];
  const chapterPlans = [{ id: 'chapter-plan-1', projectId: 'project-1', deletedAt: null }];
  let idCounter = 1;

  const matchesValue = (actual: unknown, expected: unknown): boolean => {
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      const typed = expected as AnyRecord;
      if ('not' in typed) return actual !== typed.not;
    }
    return actual === expected;
  };
  const matches = (row: AnyRecord, where: AnyRecord): boolean => Object.entries(where).every(([key, value]) => {
    if (key === 'OR' && Array.isArray(value)) return value.some((branch) => matches(row, branch));
    return matchesValue(row[key], value);
  });
  const orderRows = (rows: AnyRecord[], orderBy?: AnyRecord | AnyRecord[]) => !orderBy ? rows : [...rows].sort((a, b) => {
    for (const order of (Array.isArray(orderBy) ? orderBy : [orderBy])) {
      const [field, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc'];
      const av = a[field] instanceof Date ? a[field].getTime() : a[field];
      const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
      if (av !== bv) return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
    }
    return 0;
  });
  const makeModel = (rows: AnyRecord[], prefix: string) => ({
    findFirst: async ({ where, orderBy }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy)[0] ?? null,
    findMany: async ({ where, orderBy, skip = 0, take }: AnyRecord) => orderRows(rows.filter((row) => matches(row, where)), orderBy).slice(skip, take === undefined ? undefined : skip + take),
    count: async ({ where }: AnyRecord) => rows.filter((row) => matches(row, where)).length,
    create: async ({ data }: AnyRecord) => { const row = { id: `${prefix}-${idCounter++}`, createdAt: now, updatedAt: now, deletedAt: null, ...data }; rows.push(row); return row; },
    update: async ({ where, data }: AnyRecord) => { const row = rows.find((item) => matches(item, where)); if (!row) throw new Error(`${prefix} not found`); Object.assign(row, data, { updatedAt: new Date() }); return row; },
  });

  return {
    prisma: {
      project: makeModel(projects, 'project'),
      relationship: makeModel(relationships, 'relationship'),
      character: makeModel(characters, 'character'),
      location: makeModel(locations, 'location'),
      faction: makeModel(factions, 'faction'),
      species: makeModel(species, 'species'),
      storyItem: makeModel(storyItems, 'story-item'),
      ability: makeModel(abilities, 'ability'),
      worldRule: makeModel(worldRules, 'world-rule'),
      worldItem: makeModel(worldItems, 'world-item'),
      chapter: makeModel(chapters, 'chapter'),
      chapterPlan: makeModel(chapterPlans, 'chapter-plan'),
    },
    relationships,
  };
}

async function testCreateDefaults() {
  const { prisma } = createPrismaStub();
  const service = new RelationshipsService(prisma as any);
  const relationship = await service.createRelationship('project-1', {
    sourceType: 'character',
    sourceId: 'char-1',
    targetType: 'location',
    targetId: 'loc-1',
    relationType: ' lives_in ',
  });
  assert.equal(relationship.relationType, 'lives_in');
  assert.equal(relationship.direction, 'directed');
  assert.equal(relationship.canonStatus, 'draft');
  assert.equal(relationship.isCurrent, true);
  assert.equal(relationship.importance, 0);
}

async function testCrossProjectTargetRejected() {
  const { prisma } = createPrismaStub();
  const service = new RelationshipsService(prisma as any);
  await assert.rejects(() => service.createRelationship('project-1', {
    sourceType: 'character',
    sourceId: 'char-1',
    targetType: 'character',
    targetId: 'char-foreign',
    relationType: 'rival',
  }), (error) => error instanceof BadRequestException);
}

async function testEntityQueryMatchesSourceOrTarget() {
  const { prisma } = createPrismaStub();
  const service = new RelationshipsService(prisma as any);
  const sourceHit = await service.createRelationship('project-1', { sourceType: 'character', sourceId: 'char-1', targetType: 'location', targetId: 'loc-1', relationType: 'visited' });
  const targetHit = await service.createRelationship('project-1', { sourceType: 'faction', sourceId: 'fac-1', targetType: 'character', targetId: 'char-1', relationType: 'protects' });
  await service.createRelationship('project-1', { sourceType: 'species', sourceId: 'spe-1', targetType: 'ability', targetId: 'ability-1', relationType: 'uses' });
  const result = await service.listRelationships('project-1', { entityType: 'character', entityId: 'char-1' });
  assert.equal(result.total, 2);
  assert.deepEqual(new Set(result.items.map((item: AnyRecord) => item.id)), new Set([sourceHit.id, targetHit.id]));
}

async function testBidirectionalRelationshipAppearsFromEitherSide() {
  const { prisma } = createPrismaStub();
  const service = new RelationshipsService(prisma as any);
  const relationship = await service.createRelationship('project-1', {
    sourceType: 'character',
    sourceId: 'char-1',
    targetType: 'location',
    targetId: 'loc-1',
    relationType: 'bonded_to',
    direction: 'bidirectional',
  });
  const fromTargetSide = await service.listRelationships('project-1', { entityType: 'location', entityId: 'loc-1' });
  assert.equal(fromTargetSide.total, 1);
  assert.equal(fromTargetSide.items[0].id, relationship.id);
  assert.equal(fromTargetSide.items[0].direction, 'bidirectional');
}

async function testDuplicateDetection() {
  const { prisma } = createPrismaStub();
  const service = new RelationshipsService(prisma as any);
  const input = { sourceType: 'character', sourceId: 'char-1', targetType: 'location', targetId: 'loc-1', relationType: 'visited' };
  await service.createRelationship('project-1', input);
  await assert.rejects(() => service.createRelationship('project-1', input), (error) => error instanceof ConflictException);
}

async function run() {
  await testCreateDefaults();
  await testCrossProjectTargetRejected();
  await testEntityQueryMatchesSourceOrTarget();
  await testBidirectionalRelationshipAppearsFromEitherSide();
  await testDuplicateDetection();
  console.log('relationships service behavior tests passed');
}

run().catch((error) => { console.error(error); process.exit(1); });

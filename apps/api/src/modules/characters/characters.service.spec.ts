import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CharactersService } from './characters.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const characters: AnyRecord[] = [];
  const states: AnyRecord[] = [];
  const identities: AnyRecord[] = [];
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
    const order = Array.isArray(orderBy) ? orderBy[0] : orderBy;
    const [field, direction] = Object.entries(order)[0] as [string, 'asc' | 'desc'];
    return [...rows].sort((a, b) => {
      const av = a[field] instanceof Date ? a[field].getTime() : a[field];
      const bv = b[field] instanceof Date ? b[field].getTime() : b[field];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * (direction === 'desc' ? -1 : 1);
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
    data: { projects, characters, states, identities },
    prisma: {
      project: makeModel(projects, 'project'),
      character: makeModel(characters, 'character'),
      characterState: makeModel(states, 'state'),
      characterIdentity: makeModel(identities, 'identity'),
      chapter: makeModel([], 'chapter'),
      $transaction: async (fn: any) => fn({
        project: makeModel(projects, 'project'),
        character: makeModel(characters, 'character'),
        characterState: makeModel(states, 'state'),
        characterIdentity: makeModel(identities, 'identity'),
        chapter: makeModel([], 'chapter'),
      }),
    },
  };
}

async function testCreateCharacterDraftFirst() {
  const { prisma } = createPrismaStub();
  const service = new CharactersService(prisma as any);

  const character = await service.createCharacter('project-1', {
    name: '  林晚  ',
    role: 'protagonist',
    sourceType: 'user',
    sourceId: 'note-1',
  });

  assert.equal(character.name, '林晚');
  assert.equal(character.projectId, 'project-1');
  assert.equal(character.canonStatus, 'draft');
  assert.equal(character.sourceType, 'user');
  assert.equal(character.sourceId, 'note-1');
}

async function testProfileUsesLatestStateAndVisibleIdentities() {
  const { prisma } = createPrismaStub();
  const service = new CharactersService(prisma as any);
  const character = await service.createCharacter('project-1', { name: '林晚' });
  await service.createState('project-1', character.id, { stage: 'old', orderIndex: 1 });
  const latest = await service.createState('project-1', character.id, { stage: 'new', orderIndex: 2 });
  const identity = await service.createIdentity('project-1', character.id, { title: '真实身份', isPublic: false });
  const deleted = await service.createIdentity('project-1', character.id, { title: '旧身份' });
  await service.deleteIdentity('project-1', character.id, deleted.id);

  const profile = await service.getProfile('project-1', character.id);

  assert.equal(profile.character.id, character.id);
  assert.equal(profile.latestState?.id, latest.id);
  assert.deepEqual(profile.identities.map((item: any) => item.id), [identity.id]);
}

async function testProjectBoundaryRejectsForeignCharacter() {
  const { prisma } = createPrismaStub();
  const service = new CharactersService(prisma as any);
  const character = await service.createCharacter('project-1', { name: '林晚' });

  await assert.rejects(
    () => service.getCharacter('project-2', character.id),
    (error) => error instanceof NotFoundException,
  );
}

async function testNumericValidationAndEmptyChapterBoundary() {
  const { prisma } = createPrismaStub();
  const service = new CharactersService(prisma as any);
  const character = await service.createCharacter('project-1', { name: '林晚' });

  await assert.rejects(
    () => service.createCharacter('project-1', { name: '林晚', importance: -1 }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.updateCharacter('project-1', character.id, { importance: 1.5 }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.createState('project-1', character.id, { chapterId: '   ' }),
    (error) => error instanceof BadRequestException,
  );
}

async function run() {
  await testCreateCharacterDraftFirst();
  await testProfileUsesLatestStateAndVisibleIdentities();
  await testProjectBoundaryRejectsForeignCharacter();
  await testNumericValidationAndEmptyChapterBoundary();
  console.log('characters service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

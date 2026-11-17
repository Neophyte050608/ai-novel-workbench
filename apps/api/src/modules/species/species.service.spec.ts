import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SpeciesService } from './species.service';

type AnyRecord = Record<string, any>;

function createPrismaStub() {
  const projects = [{ id: 'project-1', deletedAt: null }];
  const species: AnyRecord[] = [];
  const traits: AnyRecord[] = [];
  const abilities: AnyRecord[] = [];
  const rules: AnyRecord[] = [];
  const worldRules: AnyRecord[] = [{ id: 'rule-1', projectId: 'project-1', deletedAt: null }];
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
    data: { projects, species, traits, abilities, rules, worldRules },
    prisma: {
      project: makeModel(projects, 'project'),
      species: makeModel(species, 'species'),
      speciesTrait: makeModel(traits, 'trait'),
      speciesAbility: makeModel(abilities, 'ability'),
      speciesRule: makeModel(rules, 'species-rule'),
      worldRule: makeModel(worldRules, 'world-rule'),
    },
  };
}

async function testCreateSpeciesDraftFirstAndTrimmed() {
  const { prisma } = createPrismaStub();
  const service = new SpeciesService(prisma as any);

  const created = await service.createSpecies('project-1', {
    name: '  九尾灵狐  ',
    speciesType: ' beast ',
    aliases: [' 狐族 ', '', '灵狐'],
  });

  assert.equal(created.name, '九尾灵狐');
  assert.equal(created.speciesType, 'beast');
  assert.equal(created.projectId, 'project-1');
  assert.equal(created.canonStatus, 'draft');
  assert.deepEqual(created.aliases, ['狐族', '灵狐']);
}

async function testProfileUsesTraitsAbilitiesAndRules() {
  const { prisma } = createPrismaStub();
  const service = new SpeciesService(prisma as any);
  const species = await service.createSpecies('project-1', { name: '九尾灵狐' });
  const weakerTrait = await service.createTrait('project-1', species.id, { name: '畏惧雷火', importance: 1 });
  const strongerTrait = await service.createTrait('project-1', species.id, { name: '九尾血脉', importance: 9 });
  const ability = await service.createAbility('project-1', species.id, { name: ' 幻心术 ', aliases: ['狐幻', ' '] });
  const rule = await service.createRule('project-1', species.id, { worldRuleId: 'rule-1', isPrimary: true });

  const profile = await service.getProfile('project-1', species.id);

  assert.equal(profile.species.id, species.id);
  assert.deepEqual(profile.traits.map((item: any) => item.id), [strongerTrait.id, weakerTrait.id]);
  assert.deepEqual(profile.abilities.map((item: any) => item.id), [ability.id]);
  assert.deepEqual(profile.rules.map((item: any) => item.id), [rule.id]);
  assert.deepEqual(profile.abilities[0].aliases, ['狐幻']);
}

async function testSpeciesRelationsEnforceProjectBoundary() {
  const { prisma } = createPrismaStub();
  const service = new SpeciesService(prisma as any);
  const species = await service.createSpecies('project-1', { name: '九尾灵狐' });

  await assert.rejects(
    () => service.createRule('project-1', species.id, { worldRuleId: 'foreign-rule' }),
    (error) => error instanceof BadRequestException,
  );
  await assert.rejects(
    () => service.getSpecies('project-2', species.id),
    (error) => error instanceof NotFoundException,
  );
}

async function testWhitespaceRelationIdsAreTrimmedBeforeBoundaryChecks() {
  const { prisma } = createPrismaStub();
  const service = new SpeciesService(prisma as any);
  const parent = await service.createSpecies('project-1', { name: '灵族' });
  const child = await service.createSpecies('project-1', { name: '九尾灵狐', parentId: ` ${parent.id} ` });
  const linkedRule = await service.createRule('project-1', child.id, { worldRuleId: ' rule-1 ' });

  assert.equal(child.parentId, parent.id);
  assert.equal(linkedRule.worldRuleId, 'rule-1');
  await assert.rejects(
    () => service.updateSpecies('project-1', child.id, { parentId: '   ' }),
    (error) => error instanceof BadRequestException,
  );
}

async function run() {
  await testCreateSpeciesDraftFirstAndTrimmed();
  await testProfileUsesTraitsAbilitiesAndRules();
  await testSpeciesRelationsEnforceProjectBoundary();
  await testWhitespaceRelationIdsAreTrimmedBeforeBoundaryChecks();
  console.log('species service behavior tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

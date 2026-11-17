import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { CreateSpeciesTraitDto } from './dto/create-species-trait.dto';
import { UpdateSpeciesTraitDto } from './dto/update-species-trait.dto';
import { CreateSpeciesAbilityDto } from './dto/create-species-ability.dto';
import { UpdateSpeciesAbilityDto } from './dto/update-species-ability.dto';
import { CreateSpeciesRuleDto } from './dto/create-species-rule.dto';
import { UpdateSpeciesRuleDto } from './dto/update-species-rule.dto';

const speciesOrderBy = [{ importance: 'desc' as const }, { orderIndex: 'asc' as const }, { updatedAt: 'desc' as const }];
const traitOrderBy = [{ importance: 'desc' as const }, { updatedAt: 'desc' as const }];
const abilityOrderBy = [{ importance: 'desc' as const }, { updatedAt: 'desc' as const }];
const ruleOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];

type SpeciesData = Omit<UpdateSpeciesDto, never>;
type TraitData = Omit<UpdateSpeciesTraitDto, never>;
type AbilityData = Omit<UpdateSpeciesAbilityDto, never>;
type RuleData = Omit<UpdateSpeciesRuleDto, never>;

function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) {
  const normalized: Record<string, unknown> = { ...data };
  for (const field of fields) {
    if (field in normalized && typeof normalized[field] === 'string') {
      normalized[field] = (normalized[field] as string).trim();
    }
  }
  return normalized as T;
}

function assertNonEmptyBody(dto: object | undefined) {
  if (!dto || Object.keys(dto).length === 0) {
    throw new BadRequestException('request body cannot be empty');
  }
}

function assertNonNegativeInteger(value: number | undefined, field: string) {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new BadRequestException(`${field} must be a non-negative integer`);
  }
}

@Injectable()
export class SpeciesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSpecies(projectId: string) {
    await this.ensureProject(projectId);

    return this.prisma.species.findMany({ where: { projectId, deletedAt: null }, orderBy: speciesOrderBy });
  }

  async getSpecies(projectId: string, speciesId: string) {
    const species = await this.prisma.species.findFirst({ where: { id: speciesId, projectId, deletedAt: null } });

    if (!species) {
      throw new NotFoundException(`Species ${speciesId} not found in project ${projectId}`);
    }

    return species;
  }

  async createSpecies(projectId: string, dto: CreateSpeciesDto) {
    this.validateCreateSpecies(dto);
    await this.ensureProject(projectId);
    await this.ensureParentSpeciesBoundary(projectId, dto.parentId);

    return this.prisma.species.create({
      data: {
        ...this.normalizeSpeciesData(dto),
        name: dto.name.trim(),
        aliases: this.normalizeAliases(dto.aliases),
        projectId,
        canonStatus: 'draft',
      },
    });
  }

  async updateSpecies(projectId: string, speciesId: string, dto: UpdateSpeciesDto) {
    this.validateUpdateSpecies(dto);
    await this.getSpecies(projectId, speciesId);
    await this.ensureParentSpeciesBoundary(projectId, dto.parentId ?? undefined, speciesId);

    return this.prisma.species.update({
      where: { id: speciesId },
      data: {
        ...this.normalizeSpeciesData(dto),
        aliases: dto.aliases === undefined ? undefined : this.normalizeAliases(dto.aliases),
      },
    });
  }

  async deleteSpecies(projectId: string, speciesId: string) {
    await this.getSpecies(projectId, speciesId);

    return this.prisma.species.update({ where: { id: speciesId }, data: { deletedAt: new Date() } });
  }

  async confirmSpecies(projectId: string, speciesId: string) {
    await this.getSpecies(projectId, speciesId);

    return this.prisma.species.update({ where: { id: speciesId }, data: { canonStatus: 'confirmed' } });
  }

  async archiveSpecies(projectId: string, speciesId: string) {
    await this.getSpecies(projectId, speciesId);

    return this.prisma.species.update({ where: { id: speciesId }, data: { canonStatus: 'archived' } });
  }

  async getProfile(projectId: string, speciesId: string) {
    const species = await this.getSpecies(projectId, speciesId);
    const [traits, abilities, rules] = await Promise.all([
      this.prisma.speciesTrait.findMany({ where: { projectId, speciesId, deletedAt: null }, orderBy: traitOrderBy }),
      this.prisma.speciesAbility.findMany({ where: { projectId, speciesId, deletedAt: null }, orderBy: abilityOrderBy }),
      this.prisma.speciesRule.findMany({ where: { projectId, speciesId }, orderBy: ruleOrderBy }),
    ]);

    return { species, traits, abilities, rules };
  }

  async listTraits(projectId: string, speciesId: string) {
    await this.getSpecies(projectId, speciesId);

    return this.prisma.speciesTrait.findMany({ where: { projectId, speciesId, deletedAt: null }, orderBy: traitOrderBy });
  }

  async getTrait(projectId: string, speciesId: string, traitId: string) {
    await this.getSpecies(projectId, speciesId);
    const trait = await this.prisma.speciesTrait.findFirst({ where: { id: traitId, projectId, speciesId, deletedAt: null } });

    if (!trait) {
      throw new NotFoundException(`SpeciesTrait ${traitId} not found in species ${speciesId}`);
    }

    return trait;
  }

  async createTrait(projectId: string, speciesId: string, dto: CreateSpeciesTraitDto) {
    this.validateCreateTrait(dto);
    await this.getSpecies(projectId, speciesId);

    return this.prisma.speciesTrait.create({
      data: {
        ...this.normalizeTraitData(dto),
        name: dto.name.trim(),
        projectId,
        speciesId,
        canonStatus: 'draft',
      },
    });
  }

  async updateTrait(projectId: string, speciesId: string, traitId: string, dto: UpdateSpeciesTraitDto) {
    this.validateUpdateTrait(dto);
    await this.getTrait(projectId, speciesId, traitId);

    return this.prisma.speciesTrait.update({ where: { id: traitId }, data: this.normalizeTraitData(dto) });
  }

  async deleteTrait(projectId: string, speciesId: string, traitId: string) {
    await this.getTrait(projectId, speciesId, traitId);

    return this.prisma.speciesTrait.update({ where: { id: traitId }, data: { deletedAt: new Date() } });
  }

  async listAbilities(projectId: string, speciesId: string) {
    await this.getSpecies(projectId, speciesId);

    return this.prisma.speciesAbility.findMany({ where: { projectId, speciesId, deletedAt: null }, orderBy: abilityOrderBy });
  }

  async getAbility(projectId: string, speciesId: string, abilityId: string) {
    await this.getSpecies(projectId, speciesId);
    const ability = await this.prisma.speciesAbility.findFirst({ where: { id: abilityId, projectId, speciesId, deletedAt: null } });

    if (!ability) {
      throw new NotFoundException(`SpeciesAbility ${abilityId} not found in species ${speciesId}`);
    }

    return ability;
  }

  async createAbility(projectId: string, speciesId: string, dto: CreateSpeciesAbilityDto) {
    this.validateCreateAbility(dto);
    await this.getSpecies(projectId, speciesId);

    return this.prisma.speciesAbility.create({
      data: {
        ...this.normalizeAbilityData(dto),
        name: dto.name.trim(),
        aliases: this.normalizeAliases(dto.aliases),
        projectId,
        speciesId,
        canonStatus: 'draft',
      },
    });
  }

  async updateAbility(projectId: string, speciesId: string, abilityId: string, dto: UpdateSpeciesAbilityDto) {
    this.validateUpdateAbility(dto);
    await this.getAbility(projectId, speciesId, abilityId);

    return this.prisma.speciesAbility.update({
      where: { id: abilityId },
      data: {
        ...this.normalizeAbilityData(dto),
        aliases: dto.aliases === undefined ? undefined : this.normalizeAliases(dto.aliases),
      },
    });
  }

  async deleteAbility(projectId: string, speciesId: string, abilityId: string) {
    await this.getAbility(projectId, speciesId, abilityId);

    return this.prisma.speciesAbility.update({ where: { id: abilityId }, data: { deletedAt: new Date() } });
  }

  async listRules(projectId: string, speciesId: string) {
    await this.getSpecies(projectId, speciesId);

    return this.prisma.speciesRule.findMany({ where: { projectId, speciesId }, orderBy: ruleOrderBy });
  }

  async getRule(projectId: string, speciesId: string, speciesRuleId: string) {
    await this.getSpecies(projectId, speciesId);
    const speciesRule = await this.prisma.speciesRule.findFirst({ where: { id: speciesRuleId, projectId, speciesId } });

    if (!speciesRule) {
      throw new NotFoundException(`SpeciesRule ${speciesRuleId} not found in species ${speciesId}`);
    }

    return speciesRule;
  }

  async createRule(projectId: string, speciesId: string, dto: CreateSpeciesRuleDto) {
    this.validateCreateRule(dto);
    await this.getSpecies(projectId, speciesId);
    await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId);

    return this.prisma.speciesRule.create({
      data: {
        ...this.normalizeRuleData(dto),
        worldRuleId: dto.worldRuleId.trim(),
        projectId,
        speciesId,
      },
    });
  }

  async updateRule(projectId: string, speciesId: string, speciesRuleId: string, dto: UpdateSpeciesRuleDto) {
    this.validateUpdateRule(dto);
    await this.getRule(projectId, speciesId, speciesRuleId);
    await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId);

    return this.prisma.speciesRule.update({ where: { id: speciesRuleId }, data: this.normalizeRuleData(dto) });
  }

  async deleteRule(projectId: string, speciesId: string, speciesRuleId: string) {
    await this.getRule(projectId, speciesId, speciesRuleId);

    return this.prisma.speciesRule.delete({ where: { id: speciesRuleId } });
  }

  private async ensureProject(projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
  }

  private async ensureParentSpeciesBoundary(projectId: string, parentId?: string | null, selfId?: string) {
    if (parentId === undefined || parentId === null) return;
    const normalizedParentId = parentId.trim();
    if (!normalizedParentId) {
      throw new BadRequestException('parentId cannot be empty');
    }
    if (normalizedParentId === selfId) {
      throw new BadRequestException('parentId cannot be the species itself');
    }
    const parent = await this.prisma.species.findFirst({ where: { id: normalizedParentId, projectId, deletedAt: null }, select: { id: true } });
    if (!parent) {
      throw new BadRequestException('parentId must belong to the project');
    }
  }

  private async ensureWorldRuleBoundary(projectId: string, worldRuleId?: string | null) {
    if (worldRuleId === undefined || worldRuleId === null) return;
    const normalizedWorldRuleId = worldRuleId.trim();
    if (!normalizedWorldRuleId) {
      throw new BadRequestException('worldRuleId cannot be empty');
    }
    const worldRule = await this.prisma.worldRule.findFirst({ where: { id: normalizedWorldRuleId, projectId, deletedAt: null }, select: { id: true } });
    if (!worldRule) {
      throw new BadRequestException('worldRuleId must belong to the project');
    }
  }

  private validateCreateSpecies(dto: CreateSpeciesDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateUpdateSpecies(dto: UpdateSpeciesDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new BadRequestException('name cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateCreateTrait(dto: CreateSpeciesTraitDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateUpdateTrait(dto: UpdateSpeciesTraitDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new BadRequestException('name cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateCreateAbility(dto: CreateSpeciesAbilityDto) {
    if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
      throw new BadRequestException('name is required');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateUpdateAbility(dto: UpdateSpeciesAbilityDto) {
    assertNonEmptyBody(dto);
    if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) {
      throw new BadRequestException('name cannot be empty');
    }
    assertNonNegativeInteger(dto.importance, 'importance');
  }

  private validateCreateRule(dto: CreateSpeciesRuleDto) {
    if (!dto || typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0) {
      throw new BadRequestException('worldRuleId is required');
    }
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private validateUpdateRule(dto: UpdateSpeciesRuleDto) {
    assertNonEmptyBody(dto);
    if (dto.worldRuleId !== undefined && (typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0)) {
      throw new BadRequestException('worldRuleId cannot be empty');
    }
    assertNonNegativeInteger(dto.orderIndex, 'orderIndex');
  }

  private normalizeSpeciesData(data: SpeciesData) {
    return normalizeOptionalStrings(data, [
      'parentId',
      'name',
      'speciesType',
      'narrativeRole',
      'summary',
      'description',
      'appearance',
      'lifespan',
      'reproduction',
      'socialStructure',
      'rarity',
      'status',
      'visibility',
      'sourceType',
      'sourceId',
    ]);
  }

  private normalizeTraitData(data: TraitData) {
    return normalizeOptionalStrings(data, ['traitType', 'name', 'summary', 'description', 'sourceType', 'sourceId']);
  }

  private normalizeAbilityData(data: AbilityData) {
    return normalizeOptionalStrings(data, [
      'name',
      'abilityType',
      'summary',
      'description',
      'effect',
      'cost',
      'limitation',
      'condition',
      'inheritanceType',
      'awakeningCondition',
      'masteryNotes',
      'visibility',
      'sourceType',
      'sourceId',
    ]);
  }

  private normalizeRuleData(data: RuleData) {
    return normalizeOptionalStrings(data, ['worldRuleId', 'relationType', 'enforcementLevel', 'notes']);
  }

  private normalizeAliases(aliases: string[] | undefined) {
    return aliases?.map((alias) => alias.trim()).filter((alias) => alias.length > 0) ?? [];
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { UpdateAbilityDto } from './dto/update-ability.dto';
import { CreateAbilityRuleDto } from './dto/create-ability-rule.dto';
import { UpdateAbilityRuleDto } from './dto/update-ability-rule.dto';

const abilityOrderBy = [{ importance: 'desc' as const }, { orderIndex: 'asc' as const }, { updatedAt: 'desc' as const }];
const ruleOrderBy = [{ orderIndex: 'asc' as const }, { createdAt: 'asc' as const }];
type AbilityData = Omit<UpdateAbilityDto, never>;
type RuleData = Omit<UpdateAbilityRuleDto, never>;
function normalizeOptionalStrings<T extends Record<string, unknown>>(data: T, fields: string[]) { const normalized: Record<string, unknown> = { ...data }; for (const field of fields) if (field in normalized && typeof normalized[field] === 'string') normalized[field] = (normalized[field] as string).trim(); return normalized as T; }
function assertNonEmptyBody(dto: object | undefined) { if (!dto || Object.keys(dto).length === 0) throw new BadRequestException('request body cannot be empty'); }
function assertNonNegativeInteger(value: number | undefined, field: string) { if (value !== undefined && (!Number.isInteger(value) || value < 0)) throw new BadRequestException(`${field} must be a non-negative integer`); }

@Injectable()
export class AbilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listAbilities(projectId: string) { await this.ensureProject(projectId); return this.prisma.ability.findMany({ where: { projectId, deletedAt: null }, orderBy: abilityOrderBy }); }
  async getAbility(projectId: string, abilityId: string) { const ability = await this.prisma.ability.findFirst({ where: { id: abilityId, projectId, deletedAt: null } }); if (!ability) throw new NotFoundException(`Ability ${abilityId} not found in project ${projectId}`); return ability; }
  async createAbility(projectId: string, dto: CreateAbilityDto) { this.validateCreateAbility(dto); await this.ensureProject(projectId); return this.prisma.ability.create({ data: { ...this.normalizeAbilityData(dto), name: dto.name.trim(), aliases: this.normalizeAliases(dto.aliases), projectId, canonStatus: 'draft' } }); }
  async updateAbility(projectId: string, abilityId: string, dto: UpdateAbilityDto) { this.validateUpdateAbility(dto); await this.getAbility(projectId, abilityId); return this.prisma.ability.update({ where: { id: abilityId }, data: { ...this.normalizeAbilityData(dto), aliases: dto.aliases === undefined ? undefined : this.normalizeAliases(dto.aliases) } }); }
  async deleteAbility(projectId: string, abilityId: string) { await this.getAbility(projectId, abilityId); return this.prisma.ability.update({ where: { id: abilityId }, data: { deletedAt: new Date() } }); }
  async confirmAbility(projectId: string, abilityId: string) { await this.getAbility(projectId, abilityId); return this.prisma.ability.update({ where: { id: abilityId }, data: { canonStatus: 'confirmed' } }); }
  async archiveAbility(projectId: string, abilityId: string) { await this.getAbility(projectId, abilityId); return this.prisma.ability.update({ where: { id: abilityId }, data: { canonStatus: 'archived' } }); }
  async getProfile(projectId: string, abilityId: string) { const ability = await this.getAbility(projectId, abilityId); const rules = await this.prisma.abilityRule.findMany({ where: { projectId, abilityId }, orderBy: ruleOrderBy }); return { ability, rules }; }

  async listRules(projectId: string, abilityId: string) { await this.getAbility(projectId, abilityId); return this.prisma.abilityRule.findMany({ where: { projectId, abilityId }, orderBy: ruleOrderBy }); }
  async getRule(projectId: string, abilityId: string, abilityRuleId: string) { await this.getAbility(projectId, abilityId); const rule = await this.prisma.abilityRule.findFirst({ where: { id: abilityRuleId, projectId, abilityId } }); if (!rule) throw new NotFoundException(`AbilityRule ${abilityRuleId} not found in ability ${abilityId}`); return rule; }
  async createRule(projectId: string, abilityId: string, dto: CreateAbilityRuleDto) { this.validateCreateRule(dto); await this.getAbility(projectId, abilityId); await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId); return this.prisma.abilityRule.create({ data: { ...this.normalizeRuleData(dto), worldRuleId: dto.worldRuleId.trim(), projectId, abilityId } }); }
  async updateRule(projectId: string, abilityId: string, abilityRuleId: string, dto: UpdateAbilityRuleDto) { this.validateUpdateRule(dto); await this.getRule(projectId, abilityId, abilityRuleId); await this.ensureWorldRuleBoundary(projectId, dto.worldRuleId); return this.prisma.abilityRule.update({ where: { id: abilityRuleId }, data: this.normalizeRuleData(dto) }); }
  async deleteRule(projectId: string, abilityId: string, abilityRuleId: string) { await this.getRule(projectId, abilityId, abilityRuleId); return this.prisma.abilityRule.delete({ where: { id: abilityRuleId } }); }

  private async ensureProject(projectId: string) { const project = await this.prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true } }); if (!project) throw new NotFoundException(`Project ${projectId} not found`); }
  private async ensureWorldRuleBoundary(projectId: string, worldRuleId?: string | null) { if (worldRuleId === undefined || worldRuleId === null) return; const id = worldRuleId.trim(); if (!id) throw new BadRequestException('worldRuleId cannot be empty'); const worldRule = await this.prisma.worldRule.findFirst({ where: { id, projectId, deletedAt: null }, select: { id: true } }); if (!worldRule) throw new BadRequestException('worldRuleId must belong to the project'); }
  private validateCreateAbility(dto: CreateAbilityDto) { if (!dto || typeof dto.name !== 'string' || dto.name.trim().length === 0) throw new BadRequestException('name is required'); assertNonNegativeInteger(dto.importance, 'importance'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private validateUpdateAbility(dto: UpdateAbilityDto) { assertNonEmptyBody(dto); if (dto.name !== undefined && (typeof dto.name !== 'string' || dto.name.trim().length === 0)) throw new BadRequestException('name cannot be empty'); assertNonNegativeInteger(dto.importance, 'importance'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private validateCreateRule(dto: CreateAbilityRuleDto) { if (!dto || typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0) throw new BadRequestException('worldRuleId is required'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private validateUpdateRule(dto: UpdateAbilityRuleDto) { assertNonEmptyBody(dto); if (dto.worldRuleId !== undefined && (typeof dto.worldRuleId !== 'string' || dto.worldRuleId.trim().length === 0)) throw new BadRequestException('worldRuleId cannot be empty'); assertNonNegativeInteger(dto.orderIndex, 'orderIndex'); }
  private normalizeAbilityData(data: AbilityData) { return normalizeOptionalStrings(data, ['name', 'abilityType', 'narrativeRole', 'summary', 'description', 'effect', 'cost', 'limitation', 'condition', 'source', 'progression', 'masteryNotes', 'countermeasure', 'visibility', 'sourceType', 'sourceId']); }
  private normalizeRuleData(data: RuleData) { return normalizeOptionalStrings(data, ['worldRuleId', 'relationType', 'enforcementLevel', 'notes']); }
  private normalizeAliases(aliases: string[] | undefined) { return aliases?.map((alias) => alias.trim()).filter((alias) => alias.length > 0) ?? []; }
}

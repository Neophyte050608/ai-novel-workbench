import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AbilitiesService } from './abilities.service';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { CreateAbilityRuleDto } from './dto/create-ability-rule.dto';
import { UpdateAbilityDto } from './dto/update-ability.dto';
import { UpdateAbilityRuleDto } from './dto/update-ability-rule.dto';

@Controller('projects/:projectId/abilities')
export class AbilitiesController {
  constructor(private readonly abilities: AbilitiesService) {}

  @Get()
  listAbilities(@Param('projectId') projectId: string) { return this.abilities.listAbilities(projectId); }
  @Post()
  createAbility(@Param('projectId') projectId: string, @Body() dto: CreateAbilityDto) { return this.abilities.createAbility(projectId, dto); }
  @Get(':abilityId')
  getAbility(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string) { return this.abilities.getAbility(projectId, abilityId); }
  @Patch(':abilityId')
  updateAbility(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string, @Body() dto: UpdateAbilityDto) { return this.abilities.updateAbility(projectId, abilityId, dto); }
  @Delete(':abilityId')
  deleteAbility(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string) { return this.abilities.deleteAbility(projectId, abilityId); }
  @Post(':abilityId/confirm')
  confirmAbility(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string) { return this.abilities.confirmAbility(projectId, abilityId); }
  @Post(':abilityId/archive')
  archiveAbility(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string) { return this.abilities.archiveAbility(projectId, abilityId); }
  @Get(':abilityId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string) { return this.abilities.getProfile(projectId, abilityId); }

  @Get(':abilityId/rules')
  listRules(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string) { return this.abilities.listRules(projectId, abilityId); }
  @Post(':abilityId/rules')
  createRule(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string, @Body() dto: CreateAbilityRuleDto) { return this.abilities.createRule(projectId, abilityId, dto); }
  @Get(':abilityId/rules/:abilityRuleId')
  getRule(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string, @Param('abilityRuleId') abilityRuleId: string) { return this.abilities.getRule(projectId, abilityId, abilityRuleId); }
  @Patch(':abilityId/rules/:abilityRuleId')
  updateRule(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string, @Param('abilityRuleId') abilityRuleId: string, @Body() dto: UpdateAbilityRuleDto) { return this.abilities.updateRule(projectId, abilityId, abilityRuleId, dto); }
  @Delete(':abilityId/rules/:abilityRuleId')
  deleteRule(@Param('projectId') projectId: string, @Param('abilityId') abilityId: string, @Param('abilityRuleId') abilityRuleId: string) { return this.abilities.deleteRule(projectId, abilityId, abilityRuleId); }
}

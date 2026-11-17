import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateSpeciesDto } from './dto/create-species.dto';
import { UpdateSpeciesDto } from './dto/update-species.dto';
import { CreateSpeciesTraitDto } from './dto/create-species-trait.dto';
import { UpdateSpeciesTraitDto } from './dto/update-species-trait.dto';
import { CreateSpeciesAbilityDto } from './dto/create-species-ability.dto';
import { UpdateSpeciesAbilityDto } from './dto/update-species-ability.dto';
import { CreateSpeciesRuleDto } from './dto/create-species-rule.dto';
import { UpdateSpeciesRuleDto } from './dto/update-species-rule.dto';
import { SpeciesService } from './species.service';

@Controller('projects/:projectId/species')
export class SpeciesController {
  constructor(private readonly species: SpeciesService) {}

  @Get()
  listSpecies(@Param('projectId') projectId: string) {
    return this.species.listSpecies(projectId);
  }

  @Post()
  createSpecies(@Param('projectId') projectId: string, @Body() dto: CreateSpeciesDto) {
    return this.species.createSpecies(projectId, dto);
  }

  @Get(':speciesId')
  getSpecies(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.getSpecies(projectId, speciesId);
  }

  @Patch(':speciesId')
  updateSpecies(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Body() dto: UpdateSpeciesDto) {
    return this.species.updateSpecies(projectId, speciesId, dto);
  }

  @Delete(':speciesId')
  deleteSpecies(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.deleteSpecies(projectId, speciesId);
  }

  @Post(':speciesId/confirm')
  confirmSpecies(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.confirmSpecies(projectId, speciesId);
  }

  @Post(':speciesId/archive')
  archiveSpecies(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.archiveSpecies(projectId, speciesId);
  }

  @Get(':speciesId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.getProfile(projectId, speciesId);
  }

  @Get(':speciesId/traits')
  listTraits(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.listTraits(projectId, speciesId);
  }

  @Post(':speciesId/traits')
  createTrait(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Body() dto: CreateSpeciesTraitDto) {
    return this.species.createTrait(projectId, speciesId, dto);
  }

  @Get(':speciesId/traits/:traitId')
  getTrait(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('traitId') traitId: string) {
    return this.species.getTrait(projectId, speciesId, traitId);
  }

  @Patch(':speciesId/traits/:traitId')
  updateTrait(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('traitId') traitId: string, @Body() dto: UpdateSpeciesTraitDto) {
    return this.species.updateTrait(projectId, speciesId, traitId, dto);
  }

  @Delete(':speciesId/traits/:traitId')
  deleteTrait(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('traitId') traitId: string) {
    return this.species.deleteTrait(projectId, speciesId, traitId);
  }

  @Get(':speciesId/abilities')
  listAbilities(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.listAbilities(projectId, speciesId);
  }

  @Post(':speciesId/abilities')
  createAbility(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Body() dto: CreateSpeciesAbilityDto) {
    return this.species.createAbility(projectId, speciesId, dto);
  }

  @Get(':speciesId/abilities/:abilityId')
  getAbility(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('abilityId') abilityId: string) {
    return this.species.getAbility(projectId, speciesId, abilityId);
  }

  @Patch(':speciesId/abilities/:abilityId')
  updateAbility(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('abilityId') abilityId: string, @Body() dto: UpdateSpeciesAbilityDto) {
    return this.species.updateAbility(projectId, speciesId, abilityId, dto);
  }

  @Delete(':speciesId/abilities/:abilityId')
  deleteAbility(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('abilityId') abilityId: string) {
    return this.species.deleteAbility(projectId, speciesId, abilityId);
  }

  @Get(':speciesId/rules')
  listRules(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string) {
    return this.species.listRules(projectId, speciesId);
  }

  @Post(':speciesId/rules')
  createRule(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Body() dto: CreateSpeciesRuleDto) {
    return this.species.createRule(projectId, speciesId, dto);
  }

  @Get(':speciesId/rules/:speciesRuleId')
  getRule(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('speciesRuleId') speciesRuleId: string) {
    return this.species.getRule(projectId, speciesId, speciesRuleId);
  }

  @Patch(':speciesId/rules/:speciesRuleId')
  updateRule(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('speciesRuleId') speciesRuleId: string, @Body() dto: UpdateSpeciesRuleDto) {
    return this.species.updateRule(projectId, speciesId, speciesRuleId, dto);
  }

  @Delete(':speciesId/rules/:speciesRuleId')
  deleteRule(@Param('projectId') projectId: string, @Param('speciesId') speciesId: string, @Param('speciesRuleId') speciesRuleId: string) {
    return this.species.deleteRule(projectId, speciesId, speciesRuleId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateFactionDto } from './dto/create-faction.dto';
import { UpdateFactionDto } from './dto/update-faction.dto';
import { ListFactionsQueryDto } from './dto/list-factions-query.dto';
import { CreateFactionStateDto } from './dto/create-faction-state.dto';
import { UpdateFactionStateDto } from './dto/update-faction-state.dto';
import { CreateFactionMembershipDto } from './dto/create-faction-membership.dto';
import { UpdateFactionMembershipDto } from './dto/update-faction-membership.dto';
import { CreateFactionRelationDto } from './dto/create-faction-relation.dto';
import { UpdateFactionRelationDto } from './dto/update-faction-relation.dto';
import { CreateFactionRuleDto } from './dto/create-faction-rule.dto';
import { UpdateFactionRuleDto } from './dto/update-faction-rule.dto';
import { FactionsService } from './factions.service';

@Controller('projects/:projectId/factions')
export class FactionsController {
  constructor(private readonly factions: FactionsService) {}

  @Get()
  listFactions(@Param('projectId') projectId: string, @Query() query: ListFactionsQueryDto) {
    return this.factions.listFactions(projectId, query);
  }

  @Post()
  createFaction(@Param('projectId') projectId: string, @Body() dto: CreateFactionDto) {
    return this.factions.createFaction(projectId, dto);
  }

  @Get(':factionId')
  getFaction(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.getFaction(projectId, factionId);
  }

  @Patch(':factionId')
  updateFaction(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Body() dto: UpdateFactionDto) {
    return this.factions.updateFaction(projectId, factionId, dto);
  }

  @Delete(':factionId')
  deleteFaction(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.deleteFaction(projectId, factionId);
  }

  @Post(':factionId/confirm')
  confirmFaction(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.confirmFaction(projectId, factionId);
  }

  @Post(':factionId/archive')
  archiveFaction(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.archiveFaction(projectId, factionId);
  }

  @Get(':factionId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.getProfile(projectId, factionId);
  }

  @Get(':factionId/states')
  listStates(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.listStates(projectId, factionId);
  }

  @Post(':factionId/states')
  createState(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Body() dto: CreateFactionStateDto) {
    return this.factions.createState(projectId, factionId, dto);
  }

  @Get(':factionId/states/:stateId')
  getState(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('stateId') stateId: string) {
    return this.factions.getState(projectId, factionId, stateId);
  }

  @Patch(':factionId/states/:stateId')
  updateState(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('stateId') stateId: string, @Body() dto: UpdateFactionStateDto) {
    return this.factions.updateState(projectId, factionId, stateId, dto);
  }

  @Delete(':factionId/states/:stateId')
  deleteState(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('stateId') stateId: string) {
    return this.factions.deleteState(projectId, factionId, stateId);
  }

  @Get(':factionId/memberships')
  listMemberships(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.listMemberships(projectId, factionId);
  }

  @Post(':factionId/memberships')
  createMembership(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Body() dto: CreateFactionMembershipDto) {
    return this.factions.createMembership(projectId, factionId, dto);
  }

  @Get(':factionId/memberships/:membershipId')
  getMembership(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('membershipId') membershipId: string) {
    return this.factions.getMembership(projectId, factionId, membershipId);
  }

  @Patch(':factionId/memberships/:membershipId')
  updateMembership(
    @Param('projectId') projectId: string,
    @Param('factionId') factionId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateFactionMembershipDto,
  ) {
    return this.factions.updateMembership(projectId, factionId, membershipId, dto);
  }

  @Delete(':factionId/memberships/:membershipId')
  deleteMembership(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('membershipId') membershipId: string) {
    return this.factions.deleteMembership(projectId, factionId, membershipId);
  }

  @Get(':factionId/relations')
  listRelations(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.listRelations(projectId, factionId);
  }

  @Post(':factionId/relations')
  createRelation(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Body() dto: CreateFactionRelationDto) {
    return this.factions.createRelation(projectId, factionId, dto);
  }

  @Get(':factionId/relations/:relationId')
  getRelation(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('relationId') relationId: string) {
    return this.factions.getRelation(projectId, factionId, relationId);
  }

  @Patch(':factionId/relations/:relationId')
  updateRelation(
    @Param('projectId') projectId: string,
    @Param('factionId') factionId: string,
    @Param('relationId') relationId: string,
    @Body() dto: UpdateFactionRelationDto,
  ) {
    return this.factions.updateRelation(projectId, factionId, relationId, dto);
  }

  @Delete(':factionId/relations/:relationId')
  deleteRelation(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('relationId') relationId: string) {
    return this.factions.deleteRelation(projectId, factionId, relationId);
  }

  @Get(':factionId/rules')
  listRules(@Param('projectId') projectId: string, @Param('factionId') factionId: string) {
    return this.factions.listRules(projectId, factionId);
  }

  @Post(':factionId/rules')
  createRule(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Body() dto: CreateFactionRuleDto) {
    return this.factions.createRule(projectId, factionId, dto);
  }

  @Get(':factionId/rules/:factionRuleId')
  getRule(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('factionRuleId') factionRuleId: string) {
    return this.factions.getRule(projectId, factionId, factionRuleId);
  }

  @Patch(':factionId/rules/:factionRuleId')
  updateRule(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('factionRuleId') factionRuleId: string, @Body() dto: UpdateFactionRuleDto) {
    return this.factions.updateRule(projectId, factionId, factionRuleId, dto);
  }

  @Delete(':factionId/rules/:factionRuleId')
  deleteRule(@Param('projectId') projectId: string, @Param('factionId') factionId: string, @Param('factionRuleId') factionRuleId: string) {
    return this.factions.deleteRule(projectId, factionId, factionRuleId);
  }
}

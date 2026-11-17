import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateLocationFactionDto } from './dto/create-location-faction.dto';
import { CreateLocationRuleDto } from './dto/create-location-rule.dto';
import { CreateLocationStateDto } from './dto/create-location-state.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateLocationFactionDto } from './dto/update-location-faction.dto';
import { UpdateLocationRuleDto } from './dto/update-location-rule.dto';
import { UpdateLocationStateDto } from './dto/update-location-state.dto';
import { LocationsService } from './locations.service';

@Controller('projects/:projectId/locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get()
  listLocations(@Param('projectId') projectId: string) {
    return this.locations.listLocations(projectId);
  }

  @Post()
  createLocation(@Param('projectId') projectId: string, @Body() dto: CreateLocationDto) {
    return this.locations.createLocation(projectId, dto);
  }

  @Get(':locationId')
  getLocation(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.getLocation(projectId, locationId);
  }

  @Patch(':locationId')
  updateLocation(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Body() dto: UpdateLocationDto) {
    return this.locations.updateLocation(projectId, locationId, dto);
  }

  @Delete(':locationId')
  deleteLocation(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.deleteLocation(projectId, locationId);
  }

  @Post(':locationId/confirm')
  confirmLocation(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.confirmLocation(projectId, locationId);
  }

  @Post(':locationId/archive')
  archiveLocation(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.archiveLocation(projectId, locationId);
  }

  @Get(':locationId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.getProfile(projectId, locationId);
  }

  @Get(':locationId/states')
  listStates(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.listStates(projectId, locationId);
  }

  @Post(':locationId/states')
  createState(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Body() dto: CreateLocationStateDto) {
    return this.locations.createState(projectId, locationId, dto);
  }

  @Get(':locationId/states/:stateId')
  getState(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Param('stateId') stateId: string) {
    return this.locations.getState(projectId, locationId, stateId);
  }

  @Patch(':locationId/states/:stateId')
  updateState(
    @Param('projectId') projectId: string,
    @Param('locationId') locationId: string,
    @Param('stateId') stateId: string,
    @Body() dto: UpdateLocationStateDto,
  ) {
    return this.locations.updateState(projectId, locationId, stateId, dto);
  }

  @Delete(':locationId/states/:stateId')
  deleteState(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Param('stateId') stateId: string) {
    return this.locations.deleteState(projectId, locationId, stateId);
  }

  @Get(':locationId/rules')
  listRules(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.listRules(projectId, locationId);
  }

  @Post(':locationId/rules')
  createRule(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Body() dto: CreateLocationRuleDto) {
    return this.locations.createRule(projectId, locationId, dto);
  }

  @Get(':locationId/rules/:locationRuleId')
  getRule(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Param('locationRuleId') locationRuleId: string) {
    return this.locations.getRule(projectId, locationId, locationRuleId);
  }

  @Patch(':locationId/rules/:locationRuleId')
  updateRule(
    @Param('projectId') projectId: string,
    @Param('locationId') locationId: string,
    @Param('locationRuleId') locationRuleId: string,
    @Body() dto: UpdateLocationRuleDto,
  ) {
    return this.locations.updateRule(projectId, locationId, locationRuleId, dto);
  }

  @Delete(':locationId/rules/:locationRuleId')
  deleteRule(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Param('locationRuleId') locationRuleId: string) {
    return this.locations.deleteRule(projectId, locationId, locationRuleId);
  }

  @Get(':locationId/factions')
  listFactions(@Param('projectId') projectId: string, @Param('locationId') locationId: string) {
    return this.locations.listFactions(projectId, locationId);
  }

  @Post(':locationId/factions')
  createFaction(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Body() dto: CreateLocationFactionDto) {
    return this.locations.createFaction(projectId, locationId, dto);
  }

  @Get(':locationId/factions/:locationFactionId')
  getFaction(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Param('locationFactionId') locationFactionId: string) {
    return this.locations.getFaction(projectId, locationId, locationFactionId);
  }

  @Patch(':locationId/factions/:locationFactionId')
  updateFaction(
    @Param('projectId') projectId: string,
    @Param('locationId') locationId: string,
    @Param('locationFactionId') locationFactionId: string,
    @Body() dto: UpdateLocationFactionDto,
  ) {
    return this.locations.updateFaction(projectId, locationId, locationFactionId, dto);
  }

  @Delete(':locationId/factions/:locationFactionId')
  deleteFaction(@Param('projectId') projectId: string, @Param('locationId') locationId: string, @Param('locationFactionId') locationFactionId: string) {
    return this.locations.deleteFaction(projectId, locationId, locationFactionId);
  }
}

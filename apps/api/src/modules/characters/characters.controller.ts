import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CreateCharacterStateDto } from './dto/create-character-state.dto';
import { UpdateCharacterStateDto } from './dto/update-character-state.dto';
import { CreateCharacterIdentityDto } from './dto/create-character-identity.dto';
import { UpdateCharacterIdentityDto } from './dto/update-character-identity.dto';

@Controller('projects/:projectId/characters')
export class CharactersController {
  constructor(private readonly characters: CharactersService) {}

  @Get()
  listCharacters(@Param('projectId') projectId: string) {
    return this.characters.listCharacters(projectId);
  }

  @Post()
  createCharacter(@Param('projectId') projectId: string, @Body() dto: CreateCharacterDto) {
    return this.characters.createCharacter(projectId, dto);
  }

  @Get(':characterId')
  getCharacter(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.getCharacter(projectId, characterId);
  }

  @Patch(':characterId')
  updateCharacter(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Body() dto: UpdateCharacterDto) {
    return this.characters.updateCharacter(projectId, characterId, dto);
  }

  @Delete(':characterId')
  deleteCharacter(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.deleteCharacter(projectId, characterId);
  }

  @Get(':characterId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.getProfile(projectId, characterId);
  }

  @Post(':characterId/confirm')
  confirmCharacter(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.confirmCharacter(projectId, characterId);
  }

  @Post(':characterId/archive')
  archiveCharacter(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.archiveCharacter(projectId, characterId);
  }

  @Get(':characterId/states')
  listStates(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.listStates(projectId, characterId);
  }

  @Post(':characterId/states')
  createState(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Body() dto: CreateCharacterStateDto) {
    return this.characters.createState(projectId, characterId, dto);
  }

  @Get(':characterId/states/:stateId')
  getState(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Param('stateId') stateId: string) {
    return this.characters.getState(projectId, characterId, stateId);
  }

  @Patch(':characterId/states/:stateId')
  updateState(
    @Param('projectId') projectId: string,
    @Param('characterId') characterId: string,
    @Param('stateId') stateId: string,
    @Body() dto: UpdateCharacterStateDto,
  ) {
    return this.characters.updateState(projectId, characterId, stateId, dto);
  }

  @Delete(':characterId/states/:stateId')
  deleteState(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Param('stateId') stateId: string) {
    return this.characters.deleteState(projectId, characterId, stateId);
  }

  @Get(':characterId/identities')
  listIdentities(@Param('projectId') projectId: string, @Param('characterId') characterId: string) {
    return this.characters.listIdentities(projectId, characterId);
  }

  @Post(':characterId/identities')
  createIdentity(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Body() dto: CreateCharacterIdentityDto) {
    return this.characters.createIdentity(projectId, characterId, dto);
  }

  @Get(':characterId/identities/:identityId')
  getIdentity(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Param('identityId') identityId: string) {
    return this.characters.getIdentity(projectId, characterId, identityId);
  }

  @Patch(':characterId/identities/:identityId')
  updateIdentity(
    @Param('projectId') projectId: string,
    @Param('characterId') characterId: string,
    @Param('identityId') identityId: string,
    @Body() dto: UpdateCharacterIdentityDto,
  ) {
    return this.characters.updateIdentity(projectId, characterId, identityId, dto);
  }

  @Delete(':characterId/identities/:identityId')
  deleteIdentity(@Param('projectId') projectId: string, @Param('characterId') characterId: string, @Param('identityId') identityId: string) {
    return this.characters.deleteIdentity(projectId, characterId, identityId);
  }
}

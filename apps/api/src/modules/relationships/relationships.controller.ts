import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { ListRelationshipsQueryDto } from './dto/list-relationships-query.dto';
import { UpdateRelationshipDto } from './dto/update-relationship.dto';
import { RelationshipsService } from './relationships.service';

@Controller('projects/:projectId/relationships')
export class RelationshipsController {
  constructor(private readonly relationships: RelationshipsService) {}

  @Get()
  listRelationships(@Param('projectId') projectId: string, @Query() query: ListRelationshipsQueryDto) {
    return this.relationships.listRelationships(projectId, query);
  }

  @Post()
  createRelationship(@Param('projectId') projectId: string, @Body() dto: CreateRelationshipDto) {
    return this.relationships.createRelationship(projectId, dto);
  }

  @Get(':relationshipId')
  getRelationship(@Param('projectId') projectId: string, @Param('relationshipId') relationshipId: string) {
    return this.relationships.getRelationship(projectId, relationshipId);
  }

  @Patch(':relationshipId')
  updateRelationship(@Param('projectId') projectId: string, @Param('relationshipId') relationshipId: string, @Body() dto: UpdateRelationshipDto) {
    return this.relationships.updateRelationship(projectId, relationshipId, dto);
  }

  @Delete(':relationshipId')
  deleteRelationship(@Param('projectId') projectId: string, @Param('relationshipId') relationshipId: string) {
    return this.relationships.deleteRelationship(projectId, relationshipId);
  }

  @Post(':relationshipId/confirm')
  confirmRelationship(@Param('projectId') projectId: string, @Param('relationshipId') relationshipId: string) {
    return this.relationships.confirmRelationship(projectId, relationshipId);
  }

  @Post(':relationshipId/archive')
  archiveRelationship(@Param('projectId') projectId: string, @Param('relationshipId') relationshipId: string) {
    return this.relationships.archiveRelationship(projectId, relationshipId);
  }
}

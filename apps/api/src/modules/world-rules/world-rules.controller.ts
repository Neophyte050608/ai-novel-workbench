import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateWorldRuleDto } from './dto/create-world-rule.dto';
import { UpdateWorldRuleDto } from './dto/update-world-rule.dto';
import { WorldRulesService } from './world-rules.service';

@Controller('projects/:projectId/world-rules')
export class WorldRulesController {
  constructor(private readonly worldRules: WorldRulesService) {}

  @Get()
  listWorldRules(@Param('projectId') projectId: string) {
    return this.worldRules.listWorldRules(projectId);
  }

  @Post()
  createWorldRule(@Param('projectId') projectId: string, @Body() dto: CreateWorldRuleDto) {
    return this.worldRules.createWorldRule(projectId, dto);
  }

  @Get(':worldRuleId')
  getWorldRule(@Param('projectId') projectId: string, @Param('worldRuleId') worldRuleId: string) {
    return this.worldRules.getWorldRule(projectId, worldRuleId);
  }

  @Get(':worldRuleId/profile')
  getWorldRuleProfile(@Param('projectId') projectId: string, @Param('worldRuleId') worldRuleId: string) {
    return this.worldRules.getProfile(projectId, worldRuleId);
  }

  @Patch(':worldRuleId')
  updateWorldRule(@Param('projectId') projectId: string, @Param('worldRuleId') worldRuleId: string, @Body() dto: UpdateWorldRuleDto) {
    return this.worldRules.updateWorldRule(projectId, worldRuleId, dto);
  }

  @Delete(':worldRuleId')
  deleteWorldRule(@Param('projectId') projectId: string, @Param('worldRuleId') worldRuleId: string) {
    return this.worldRules.deleteWorldRule(projectId, worldRuleId);
  }

  @Post(':worldRuleId/confirm')
  confirmWorldRule(@Param('projectId') projectId: string, @Param('worldRuleId') worldRuleId: string) {
    return this.worldRules.confirmWorldRule(projectId, worldRuleId);
  }

  @Post(':worldRuleId/archive')
  archiveWorldRule(@Param('projectId') projectId: string, @Param('worldRuleId') worldRuleId: string) {
    return this.worldRules.archiveWorldRule(projectId, worldRuleId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ScenesService } from './scenes.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { ReorderScenesDto } from './dto/reorder-scenes.dto';
import { CreateScenePlanDto } from './dto/create-scene-plan.dto';
import { UpdateScenePlanDto } from './dto/update-scene-plan.dto';
import { CreateSceneVersionDto } from './dto/create-scene-version.dto';
import { UpdateSceneVersionDto } from './dto/update-scene-version.dto';
import { CreateSceneSummaryDto } from './dto/create-scene-summary.dto';
import { UpdateSceneSummaryDto } from './dto/update-scene-summary.dto';
import { CreateSceneHandoffDto } from './dto/create-scene-handoff.dto';
import { UpdateSceneHandoffDto } from './dto/update-scene-handoff.dto';

@Controller('projects/:projectId')
export class ScenesController {
  constructor(private readonly scenes: ScenesService) {}

  @Get('chapters/:chapterId/scenes')
  listScenes(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string) {
    return this.scenes.listScenes(projectId, chapterId);
  }

  @Post('chapters/:chapterId/scenes')
  createScene(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Body() dto: CreateSceneDto) {
    return this.scenes.createScene(projectId, chapterId, dto);
  }

  @Post('chapters/:chapterId/scenes/reorder')
  reorderScenes(@Param('projectId') projectId: string, @Param('chapterId') chapterId: string, @Body() dto: ReorderScenesDto) {
    return this.scenes.reorderScenes(projectId, chapterId, dto);
  }

  @Get('scenes/:sceneId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.getProfile(projectId, sceneId);
  }

  @Post('scenes/:sceneId/confirm')
  confirmScene(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.confirmScene(projectId, sceneId);
  }

  @Post('scenes/:sceneId/archive')
  archiveScene(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.archiveScene(projectId, sceneId);
  }

  @Post('scenes/:sceneId/restore')
  restoreScene(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.restoreScene(projectId, sceneId);
  }

  @Get('scenes/:sceneId')
  getScene(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.getScene(projectId, sceneId);
  }

  @Patch('scenes/:sceneId')
  updateScene(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Body() dto: UpdateSceneDto) {
    return this.scenes.updateScene(projectId, sceneId, dto);
  }

  @Delete('scenes/:sceneId')
  deleteScene(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.deleteScene(projectId, sceneId);
  }

  @Get('scenes/:sceneId/plans')
  listPlans(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.listPlans(projectId, sceneId);
  }

  @Post('scenes/:sceneId/plans')
  createPlan(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Body() dto: CreateScenePlanDto) {
    return this.scenes.createPlan(projectId, sceneId, dto);
  }

  @Post('scenes/:sceneId/plans/:planId/activate')
  activatePlan(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Param('planId') planId: string) {
    return this.scenes.activatePlan(projectId, sceneId, planId);
  }

  @Get('scene-plans/:planId')
  getPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.scenes.getPlan(projectId, planId);
  }

  @Patch('scene-plans/:planId')
  updatePlan(@Param('projectId') projectId: string, @Param('planId') planId: string, @Body() dto: UpdateScenePlanDto) {
    return this.scenes.updatePlan(projectId, planId, dto);
  }

  @Delete('scene-plans/:planId')
  deletePlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.scenes.deletePlan(projectId, planId);
  }

  @Get('scenes/:sceneId/versions')
  listVersions(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.listVersions(projectId, sceneId);
  }

  @Post('scenes/:sceneId/versions')
  createVersion(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Body() dto: CreateSceneVersionDto) {
    return this.scenes.createVersion(projectId, sceneId, dto);
  }

  @Post('scenes/:sceneId/versions/:versionId/activate')
  activateVersion(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Param('versionId') versionId: string) {
    return this.scenes.activateVersion(projectId, sceneId, versionId);
  }

  @Get('scene-versions/:versionId')
  getVersion(@Param('projectId') projectId: string, @Param('versionId') versionId: string) {
    return this.scenes.getVersion(projectId, versionId);
  }

  @Patch('scene-versions/:versionId')
  updateVersion(@Param('projectId') projectId: string, @Param('versionId') versionId: string, @Body() dto: UpdateSceneVersionDto) {
    return this.scenes.updateVersion(projectId, versionId, dto);
  }

  @Delete('scene-versions/:versionId')
  deleteVersion(@Param('projectId') projectId: string, @Param('versionId') versionId: string) {
    return this.scenes.deleteVersion(projectId, versionId);
  }

  @Get('scenes/:sceneId/summaries')
  listSummaries(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.listSummaries(projectId, sceneId);
  }

  @Post('scenes/:sceneId/summaries')
  createSummary(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Body() dto: CreateSceneSummaryDto) {
    return this.scenes.createSummary(projectId, sceneId, dto);
  }

  @Get('scene-summaries/:summaryId')
  getSummary(@Param('projectId') projectId: string, @Param('summaryId') summaryId: string) {
    return this.scenes.getSummary(projectId, summaryId);
  }

  @Patch('scene-summaries/:summaryId')
  updateSummary(@Param('projectId') projectId: string, @Param('summaryId') summaryId: string, @Body() dto: UpdateSceneSummaryDto) {
    return this.scenes.updateSummary(projectId, summaryId, dto);
  }

  @Post('scene-summaries/:summaryId/confirm')
  confirmSummary(@Param('projectId') projectId: string, @Param('summaryId') summaryId: string) {
    return this.scenes.confirmSummary(projectId, summaryId);
  }

  @Post('scene-summaries/:summaryId/archive')
  archiveSummary(@Param('projectId') projectId: string, @Param('summaryId') summaryId: string) {
    return this.scenes.archiveSummary(projectId, summaryId);
  }

  @Post('scene-summaries/:summaryId/restore')
  restoreSummary(@Param('projectId') projectId: string, @Param('summaryId') summaryId: string) {
    return this.scenes.restoreSummary(projectId, summaryId);
  }

  @Delete('scene-summaries/:summaryId')
  deleteSummary(@Param('projectId') projectId: string, @Param('summaryId') summaryId: string) {
    return this.scenes.deleteSummary(projectId, summaryId);
  }

  @Get('scenes/:sceneId/handoffs')
  listHandoffs(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string) {
    return this.scenes.listHandoffs(projectId, sceneId);
  }

  @Post('scenes/:sceneId/handoffs')
  createHandoff(@Param('projectId') projectId: string, @Param('sceneId') sceneId: string, @Body() dto: CreateSceneHandoffDto) {
    return this.scenes.createHandoff(projectId, sceneId, dto);
  }

  @Get('scene-handoffs/:handoffId')
  getHandoff(@Param('projectId') projectId: string, @Param('handoffId') handoffId: string) {
    return this.scenes.getHandoff(projectId, handoffId);
  }

  @Patch('scene-handoffs/:handoffId')
  updateHandoff(@Param('projectId') projectId: string, @Param('handoffId') handoffId: string, @Body() dto: UpdateSceneHandoffDto) {
    return this.scenes.updateHandoff(projectId, handoffId, dto);
  }

  @Post('scene-handoffs/:handoffId/confirm')
  confirmHandoff(@Param('projectId') projectId: string, @Param('handoffId') handoffId: string) {
    return this.scenes.confirmHandoff(projectId, handoffId);
  }

  @Post('scene-handoffs/:handoffId/archive')
  archiveHandoff(@Param('projectId') projectId: string, @Param('handoffId') handoffId: string) {
    return this.scenes.archiveHandoff(projectId, handoffId);
  }

  @Post('scene-handoffs/:handoffId/restore')
  restoreHandoff(@Param('projectId') projectId: string, @Param('handoffId') handoffId: string) {
    return this.scenes.restoreHandoff(projectId, handoffId);
  }

  @Delete('scene-handoffs/:handoffId')
  deleteHandoff(@Param('projectId') projectId: string, @Param('handoffId') handoffId: string) {
    return this.scenes.deleteHandoff(projectId, handoffId);
  }
}

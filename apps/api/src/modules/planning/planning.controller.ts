import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateChapterPlanDto } from './dto/create-chapter-plan.dto';
import { CreateVolumeDto } from './dto/create-volume.dto';
import { ReorderVolumesDto } from './dto/reorder-volumes.dto';
import { UpdateChapterPlanDto } from './dto/update-chapter-plan.dto';
import { UpdateVolumeDto } from './dto/update-volume.dto';
import { PlanningService } from './planning.service';

@Controller('projects/:projectId')
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get('volumes')
  listVolumes(@Param('projectId') projectId: string) {
    return this.planning.listVolumes(projectId);
  }

  @Post('volumes')
  createVolume(@Param('projectId') projectId: string, @Body() dto: CreateVolumeDto) {
    return this.planning.createVolume(projectId, dto);
  }

  @Post('volumes/reorder')
  reorderVolumes(@Param('projectId') projectId: string, @Body() dto: ReorderVolumesDto) {
    return this.planning.reorderVolumes(projectId, dto);
  }

  @Get('volumes/:volumeId')
  getVolume(@Param('projectId') projectId: string, @Param('volumeId') volumeId: string) {
    return this.planning.getVolume(projectId, volumeId);
  }

  @Patch('volumes/:volumeId')
  updateVolume(@Param('projectId') projectId: string, @Param('volumeId') volumeId: string, @Body() dto: UpdateVolumeDto) {
    return this.planning.updateVolume(projectId, volumeId, dto);
  }

  @Delete('volumes/:volumeId')
  deleteVolume(@Param('projectId') projectId: string, @Param('volumeId') volumeId: string) {
    return this.planning.deleteVolume(projectId, volumeId);
  }

  @Get('chapter-plans')
  listChapterPlans(@Param('projectId') projectId: string, @Query() query: { volumeId?: string; status?: string; includeArchived?: string; unassigned?: string }) {
    return this.planning.listChapterPlans(projectId, query);
  }

  @Post('chapter-plans')
  createChapterPlan(@Param('projectId') projectId: string, @Body() dto: CreateChapterPlanDto) {
    return this.planning.createChapterPlan(projectId, dto);
  }

  @Post('chapter-plans/:planId/create-chapter')
  createChapterFromPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.planning.createChapterFromPlan(projectId, planId);
  }

  @Post('chapter-plans/:planId/confirm')
  confirmChapterPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.planning.confirmChapterPlan(projectId, planId);
  }

  @Post('chapter-plans/:planId/archive')
  archiveChapterPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.planning.archiveChapterPlan(projectId, planId);
  }

  @Post('chapter-plans/:planId/restore')
  restoreChapterPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.planning.restoreChapterPlan(projectId, planId);
  }

  @Get('chapter-plans/:planId')
  getChapterPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.planning.getChapterPlan(projectId, planId);
  }

  @Patch('chapter-plans/:planId')
  updateChapterPlan(@Param('projectId') projectId: string, @Param('planId') planId: string, @Body() dto: UpdateChapterPlanDto) {
    return this.planning.updateChapterPlan(projectId, planId, dto);
  }

  @Delete('chapter-plans/:planId')
  deleteChapterPlan(@Param('projectId') projectId: string, @Param('planId') planId: string) {
    return this.planning.deleteChapterPlan(projectId, planId);
  }
}

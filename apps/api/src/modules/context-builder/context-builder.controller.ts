import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ContextBuilderService } from './context-builder.service';
import { BuildContextDto } from './dto/build-context.dto';

@Controller('projects/:projectId/context')
export class ContextBuilderController {
  constructor(private readonly contextBuilder: ContextBuilderService) {}

  @Post('preview')
  preview(@Param('projectId') projectId: string, @Body() dto: BuildContextDto) {
    return this.contextBuilder.preview(projectId, dto);
  }

  @Post('snapshots')
  createSnapshot(@Param('projectId') projectId: string, @Body() dto: BuildContextDto) {
    return this.contextBuilder.createSnapshot(projectId, dto);
  }

  @Get('snapshots')
  listSnapshots(@Param('projectId') projectId: string) {
    return this.contextBuilder.listSnapshots(projectId);
  }

  @Get('snapshots/:snapshotId')
  getSnapshot(@Param('projectId') projectId: string, @Param('snapshotId') snapshotId: string) {
    return this.contextBuilder.getSnapshot(projectId, snapshotId);
  }
}

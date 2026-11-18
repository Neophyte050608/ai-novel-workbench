import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateWorldItemDto } from './dto/create-world-item.dto';
import { UpdateWorldItemDto } from './dto/update-world-item.dto';
import { WorldItemsService } from './world-items.service';

@Controller('projects/:projectId/world-items')
export class WorldItemsController {
  constructor(private readonly worldItems: WorldItemsService) {}

  @Get()
  listWorldItems(@Param('projectId') projectId: string) {
    return this.worldItems.listWorldItems(projectId);
  }

  @Post()
  createWorldItem(@Param('projectId') projectId: string, @Body() dto: CreateWorldItemDto) {
    return this.worldItems.createWorldItem(projectId, dto);
  }

  @Get(':worldItemId')
  getWorldItem(@Param('projectId') projectId: string, @Param('worldItemId') worldItemId: string) {
    return this.worldItems.getWorldItem(projectId, worldItemId);
  }

  @Patch(':worldItemId')
  updateWorldItem(@Param('projectId') projectId: string, @Param('worldItemId') worldItemId: string, @Body() dto: UpdateWorldItemDto) {
    return this.worldItems.updateWorldItem(projectId, worldItemId, dto);
  }

  @Delete(':worldItemId')
  deleteWorldItem(@Param('projectId') projectId: string, @Param('worldItemId') worldItemId: string) {
    return this.worldItems.deleteWorldItem(projectId, worldItemId);
  }

  @Post(':worldItemId/confirm')
  confirmWorldItem(@Param('projectId') projectId: string, @Param('worldItemId') worldItemId: string) {
    return this.worldItems.confirmWorldItem(projectId, worldItemId);
  }

  @Post(':worldItemId/archive')
  archiveWorldItem(@Param('projectId') projectId: string, @Param('worldItemId') worldItemId: string) {
    return this.worldItems.archiveWorldItem(projectId, worldItemId);
  }
}

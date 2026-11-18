import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateStoryItemDto } from './dto/create-story-item.dto';
import { CreateStoryItemRuleDto } from './dto/create-story-item-rule.dto';
import { CreateStoryItemStateDto } from './dto/create-story-item-state.dto';
import { UpdateStoryItemDto } from './dto/update-story-item.dto';
import { UpdateStoryItemRuleDto } from './dto/update-story-item-rule.dto';
import { UpdateStoryItemStateDto } from './dto/update-story-item-state.dto';
import { StoryItemsService } from './story-items.service';

@Controller('projects/:projectId/story-items')
export class StoryItemsController {
  constructor(private readonly storyItems: StoryItemsService) {}

  @Get()
  listStoryItems(@Param('projectId') projectId: string) { return this.storyItems.listStoryItems(projectId); }
  @Post()
  createStoryItem(@Param('projectId') projectId: string, @Body() dto: CreateStoryItemDto) { return this.storyItems.createStoryItem(projectId, dto); }
  @Get(':storyItemId')
  getStoryItem(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.getStoryItem(projectId, storyItemId); }
  @Patch(':storyItemId')
  updateStoryItem(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Body() dto: UpdateStoryItemDto) { return this.storyItems.updateStoryItem(projectId, storyItemId, dto); }
  @Delete(':storyItemId')
  deleteStoryItem(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.deleteStoryItem(projectId, storyItemId); }
  @Post(':storyItemId/confirm')
  confirmStoryItem(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.confirmStoryItem(projectId, storyItemId); }
  @Post(':storyItemId/archive')
  archiveStoryItem(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.archiveStoryItem(projectId, storyItemId); }
  @Get(':storyItemId/profile')
  getProfile(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.getProfile(projectId, storyItemId); }

  @Get(':storyItemId/states')
  listStates(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.listStates(projectId, storyItemId); }
  @Post(':storyItemId/states')
  createState(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Body() dto: CreateStoryItemStateDto) { return this.storyItems.createState(projectId, storyItemId, dto); }
  @Get(':storyItemId/states/:stateId')
  getState(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Param('stateId') stateId: string) { return this.storyItems.getState(projectId, storyItemId, stateId); }
  @Patch(':storyItemId/states/:stateId')
  updateState(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Param('stateId') stateId: string, @Body() dto: UpdateStoryItemStateDto) { return this.storyItems.updateState(projectId, storyItemId, stateId, dto); }
  @Delete(':storyItemId/states/:stateId')
  deleteState(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Param('stateId') stateId: string) { return this.storyItems.deleteState(projectId, storyItemId, stateId); }

  @Get(':storyItemId/rules')
  listRules(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string) { return this.storyItems.listRules(projectId, storyItemId); }
  @Post(':storyItemId/rules')
  createRule(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Body() dto: CreateStoryItemRuleDto) { return this.storyItems.createRule(projectId, storyItemId, dto); }
  @Get(':storyItemId/rules/:storyItemRuleId')
  getRule(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Param('storyItemRuleId') storyItemRuleId: string) { return this.storyItems.getRule(projectId, storyItemId, storyItemRuleId); }
  @Patch(':storyItemId/rules/:storyItemRuleId')
  updateRule(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Param('storyItemRuleId') storyItemRuleId: string, @Body() dto: UpdateStoryItemRuleDto) { return this.storyItems.updateRule(projectId, storyItemId, storyItemRuleId, dto); }
  @Delete(':storyItemId/rules/:storyItemRuleId')
  deleteRule(@Param('projectId') projectId: string, @Param('storyItemId') storyItemId: string, @Param('storyItemRuleId') storyItemRuleId: string) { return this.storyItems.deleteRule(projectId, storyItemId, storyItemRuleId); }
}

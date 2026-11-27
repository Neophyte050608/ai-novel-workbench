import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AiDraftsService } from './ai-drafts.service';
import { ApplyAiDraftDto } from './dto/apply-ai-draft.dto';
import { CreateAiDraftDto } from './dto/create-ai-draft.dto';
import { RegenerateAiDraftDto } from './dto/regenerate-ai-draft.dto';
import { UpdateAiDraftDto } from './dto/update-ai-draft.dto';

@Controller('projects/:projectId/ai-drafts')
export class AiDraftsController {
  constructor(private readonly drafts: AiDraftsService) {}

  @Get()
  listDrafts(@Param('projectId') projectId: string, @Query('targetType') targetType?: string, @Query('targetId') targetId?: string, @Query('status') status?: string) {
    return this.drafts.listDrafts(projectId, { targetType, targetId, status });
  }

  @Post()
  createDraft(@Param('projectId') projectId: string, @Body() dto: CreateAiDraftDto) {
    return this.drafts.createDraft(projectId, dto);
  }

  @Get(':draftId')
  getDraft(@Param('projectId') projectId: string, @Param('draftId') draftId: string) {
    return this.drafts.getDraft(projectId, draftId);
  }

  @Patch(':draftId')
  updateDraft(@Param('projectId') projectId: string, @Param('draftId') draftId: string, @Body() dto: UpdateAiDraftDto) {
    return this.drafts.updateDraft(projectId, draftId, dto);
  }

  @Post(':draftId/discard')
  discardDraft(@Param('projectId') projectId: string, @Param('draftId') draftId: string) {
    return this.drafts.discardDraft(projectId, draftId);
  }

  @Post(':draftId/apply')
  applyDraft(@Param('projectId') projectId: string, @Param('draftId') draftId: string, @Body() dto: ApplyAiDraftDto) {
    return this.drafts.applyDraft(projectId, draftId, dto);
  }

  @Post(':draftId/regenerate')
  regenerateDraft(@Param('projectId') projectId: string, @Param('draftId') draftId: string, @Body() dto: RegenerateAiDraftDto) {
    return this.drafts.regenerateDraft(projectId, draftId, dto);
  }
}
